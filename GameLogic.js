// GameLogic.js
// Handles the core logic for a Tetris-like game

import { TetrisShape } from './TetrisShape.js';
import { ShapeLogic } from './shapelogic.js';

export class GameLogic {
    constructor() {
        // Initialize canvas and context for drawing
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');

        // Additional canvases for current, next, and hold tetrominos
        this.currentCanvas = document.getElementById('current');
        this.currentContext = this.currentCanvas.getContext('2d');

        this.nextCanvas = document.getElementById('next');
        this.nextContext = this.nextCanvas.getContext('2d');

        this.holdCanvas = document.getElementById('hold');
        this.holdContext = this.holdCanvas.getContext('2d');

        // Grid size for the game cells
        this.grid = 32;

        // Game state variables
        this.playfield = [];
        this.tetromino = null;
        this.count = 0;
        this.gameOver = false;
        this.rAF = null;
        this.clearedRows = 0;
        this.score = 0;
        this.holdTetromino = null;

        // Modules for tetromino shapes and game logic
        this.tetrisShape = new TetrisShape();
        this.shapeLogic = new ShapeLogic();

        // Tetromino sequence for spawning shapes
        this.tetrominoSequence = [];

        // High score management
        this.HighScore = localStorage.getItem('high-score') || 0;
        this.updateHighScore(this.HighScore);

        // Event listeners
        this.addHoldEventListener();
        this.resetButton();

        // Initialize game state
        this.initializePlayfield();
        this.initializeGame();
    }

    drawTetromino(tetromino, context) {
        const size = 30; // Size of each block in the small canvas
        context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clear canvas
    
        if (!tetromino) return; // If no tetromino to draw, return early
    
        const { matrix, name } = tetromino;
    
        context.fillStyle = this.tetrisShape.getColor(name); // Get the color for the tetromino
    
        // Draw each block of the tetromino
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col]) {
                    context.fillRect(
                        col * size,
                        row * size,
                        size - 1, // Adjust size for spacing
                        size - 1
                    );
                }
            }
        }
    }    

    // Initialize the playfield with empty cells
    initializePlayfield() {
        for (let row = -2; row < 20; row++) {
            this.playfield[row] = [];
            for (let col = 0; col < 10; col++) {
                this.playfield[row][col] = 0;
            }
        }
    }

    // Initialize the game by preparing the first tetromino and starting the game loop
    initializeGame() {
        this.tetromino = this.getNextTetromino();
        this.rAF = requestAnimationFrame(this.loop.bind(this));
        this.resetGame();
    }

    // Rotate the tetromino matrix and validate the rotation
    rotate(matrix) {
        const N = matrix.length;
        const result = new Array(N).fill(0).map(() => new Array(N).fill(0));

        // Rotate the matrix 90 degrees clockwise
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[j][N - 1 - i] = matrix[i][j];
            }
        }

        // Check if the new position is valid
        if (!this.isValidMove(result, this.tetromino.row, this.tetromino.col)) {
            return matrix; // Return the original matrix if the move is invalid
        }

        return result;
    }

    // Check if a move is valid by verifying boundaries and collisions
    isValidMove(matrix, cellRow, cellCol) {
        return this.shapeLogic.isValidMove(matrix, cellRow, cellCol, this.playfield);
    }

    // Generate or retrieve the next tetromino from the sequence
    getNextTetromino() {
        if (this.tetrominoSequence.length === 0) {
            this.shapeLogic.generateSequence(this.tetrominoSequence); // Refill sequence if empty
        }

        // Pop the next tetromino from the sequence
        const name = this.tetrominoSequence.pop();
        const matrix = this.tetrisShape.getTetromino(name);

        // Position the tetromino above the playfield
        const col = this.playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
        const row = name === 'I' ? -1 : -2;

        return { name, matrix, row, col };
    }

    // Add event listener for holding tetrominoes
    addHoldEventListener() {
        document.addEventListener('keydown', (event) => {
            if (event.shiftKey) {
                this.hold();
            }
        });
    }

    // Handle the hold functionality for swapping tetrominoes
    hold() {
        if (!this.holdTetromino) {
            // First time holding: swap and get the next tetromino
            this.holdTetromino = this.tetromino;
            this.tetromino = this.getNextTetromino();
        } else {
            // Swap the current and held tetromino
            const temp = this.tetromino;
            this.tetromino = this.holdTetromino;
            this.holdTetromino = temp;
        }

        // Update the display for both current and held tetrominoes
        this.drawTetromino(this.tetromino, this.context);
        this.drawTetromino(this.holdTetromino, this.hold.getContext('2d'));
    }

    // Place the current tetromino on the playfield
    placeTetromino() {
        for (let row = 0; row < this.tetromino.matrix.length; row++) {
            for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
                if (this.tetromino.matrix[row][col]) {
                    // Check for game over condition
                    if (this.tetromino.row + row < 0) {
                        return this.showGameOver();
                    }

                    // Place the block on the playfield
                    this.playfield[this.tetromino.row + row][this.tetromino.col + col] = this.tetromino.name;
                }
            }
        }

        // Check and clear full rows, then spawn the next tetromino
        this.checkForFullRows();
        this.tetromino = this.getNextTetromino();
        this.canHold = true; // Allow holding again
    }
    // Check for full rows in the playfield and clear them
    checkForFullRows() {
        let clearedRows = 0;

        for (let row = this.playfield.length - 1; row >= 0;) {
            // If the row is full (all cells are non-zero)
            if (this.playfield[row].every(cell => !!cell)) {
                clearedRows++;
                // Remove the full row and add an empty row at the top
                this.playfield.splice(row, 1);
                this.playfield.unshift(Array(10).fill(0));

                // Update the score based on rows cleared
                this.score += this.calculateScore(clearedRows);
                this.updateScore(this.score);
            } else {
                row--; // Move to the next row
            }
        }
    }

    // Display the "Game Over" screen and stop the game loop
    showGameOver() {
        cancelAnimationFrame(this.rAF); // Stop the game loop
        this.gameOver = true;

        // Display a semi-transparent overlay
        this.context.fillStyle = 'black';
        this.context.globalAlpha = 0.75;
        this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);

        // Display the "Game Over" text
        this.context.fillStyle = 'white';
        this.context.font = '36px monospace';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText('GAME OVER!', this.canvas.width / 2, this.canvas.height / 2);
    }

    // Reset the game state and start a new game
    resetGame() {
        this.initializePlayfield(); // Clear the playfield
        this.tetrominoSequence.length = 0; // Clear the tetromino sequence
        this.tetromino = this.getNextTetromino(); // Get the first tetromino
        this.count = 0; // Reset frame count
        this.gameOver = false; // Reset game over status
        this.updateScore(0); // Reset score
        if (this.rAF) {
            cancelAnimationFrame(this.rAF); // Stop any existing game loop
        }
        this.rAF = requestAnimationFrame(this.loop.bind(this)); // Start a new game loop
    }

    // Handle the reset button logic
    resetButton() {
        const resetButton = document.getElementById('reset-btn');
        resetButton.addEventListener('click', () => {
            this.resetGame();
            resetButton.blur(); // Remove focus from the button
        });
    }

    // Update the score and update the UI
    updateScore(score) {
        const scoreElement = document.getElementById('score-value');
        scoreElement.textContent = score; // Update the score display
        this.score = score;

        // Check if a new high score has been reached
        const highScore = localStorage.getItem('high-score') || 0;
        if (score > highScore) {
            localStorage.setItem('high-score', score); // Save the new high score
            this.updateHighScore(score);
        }
    }

    // Update the high score and update the UI
updateHighScore(highScore) {
    const highScoreElement = document.getElementById("high-score");
    
    if (highScoreElement) {
        // Find the <span> element inside #high-score
        const spanElement = highScoreElement.querySelector('span');
        
        if (spanElement) {
            // Update only the content of the <span> (the number)
            spanElement.textContent = highScore;
        } else {
            // If the <span> is missing, recreate it
            const newSpan = document.createElement('span');
            newSpan.textContent = highScore;
            highScoreElement.appendChild(newSpan);
        }
    }
    
    // Update the internal high score
    this.HighScore = highScore;
}
    // Calculate the score based on the number of cleared rows
    calculateScore(clearedRows) {
        const baseScore = [0, 40, 100, 300, 1200]; // Scoring for 1, 2, 3, or 4 rows cleared
        return baseScore[clearedRows] || 0;
    }

    // Main game loop: Updates the game state and renders the playfield
    loop() {
        this.rAF = requestAnimationFrame(this.loop.bind(this)); // Schedule the next frame
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas

        // Draw the playfield
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                if (this.playfield[row][col]) {
                    const name = this.playfield[row][col];
                    this.context.fillStyle = this.tetrisShape.getColor(name);
                    this.context.fillRect(
                        col * this.grid,
                        row * this.grid,
                        this.grid - 1,
                        this.grid - 1
                    );
                }
            }
        }

        // Update and draw the current tetromino
        if (this.tetromino) {
            if (++this.count > 60) { // Gravity: Move tetromino down every 60 frames
                this.tetromino.row++;
                this.count = 0;

                // If the move is invalid, place the tetromino
                if (!this.isValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col)) {
                    this.tetromino.row--;
                    this.placeTetromino();
                }
            }

            this.drawShadow(); // Draw the shadow of the tetromino
            this.context.fillStyle = this.tetrisShape.getColor(this.tetromino.name);

            // Draw the tetromino on the canvas
            for (let row = 0; row < this.tetromino.matrix.length; row++) {
                for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
                    if (this.tetromino.matrix[row][col]) {
                        this.context.fillRect(
                            (this.tetromino.col + col) * this.grid,
                            (this.tetromino.row + row) * this.grid,
                            this.grid - 1,
                            this.grid - 1
                        );
                    }
                }
            }
        }
                // Draw current tetromino
        this.drawTetromino(this.tetromino, this.currentContext);

        // Draw next tetromino
        this.drawTetromino(this.nextTetromino, this.nextContext);

        // Draw hold tetromino (if any)
        this.drawTetromino(this.holdTetromino, this.holdContext);
    }

    holdTetromino() {
        if (!this.canHold) return; // Prevent holding multiple times in one turn
    
        if (this.holdTetromino) {
            // Swap the current tetromino with the held one
            [this.tetromino, this.holdTetromino] = [this.holdTetromino, this.tetromino];
            this.tetromino.row = 0; // Reset position
            this.tetromino.col = Math.floor(this.playfield[0].length / 2) - 1; // Center it
        } else {
            // Hold the current tetromino and get a new one
            this.holdTetromino = this.tetromino;
            this.tetromino = this.getNextTetromino();
        }
    
        this.canHold = false; // Disable holding for the rest of this turn
    }
    

    // Draw the shadow of the current tetromino (shows where it will land)
    drawShadow() {
        let shadowRow = this.calculateShadowRow(); // Determine the row where the tetromino will land
        for (let row = 0; row < this.tetromino.matrix.length; row++) {
            for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
                if (this.tetromino.matrix[row][col]) {
                    this.context.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Transparent color for shadow
                    this.context.fillRect(
                        (this.tetromino.col + col) * this.grid,
                        (shadowRow + row) * this.grid,
                        this.grid - 1,
                        this.grid - 1
                    );
                }
            }
        }
    }

    // Calculate the row where the tetromino will land
    calculateShadowRow() {
        let shadowRow = this.tetromino.row;

        // Move the tetromino down until it can't go further
        while (this.isValidMove(this.tetromino.matrix, shadowRow + 1, this.tetromino.col)) {
            shadowRow++;
        }

        return shadowRow; // Return the calculated row
    }

    // Move the tetromino down one row
    moveDown() {
        const row = this.tetromino.row + 1;

        // Check if the move is valid
        if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
            this.tetromino.row = row - 1; // Move back and place the tetromino
            this.placeTetromino();
            return;
        }

        this.tetromino.row = row; // Update the position
    }

    // Drop the tetromino instantly to the lowest valid row
    drop() {
        for (let row = this.tetromino.row + 1; row < this.playfield.length; row++) {
            if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
                this.tetromino.row = row - 1; // Move back to the last valid position
                break;
            }
            this.tetromino.row = row; // Update the position
        }
    }
}
// GameLogic.js
import { TetrisShape } from './TetrisShape.js';
import { ShapeLogic } from './shapelogic.js';

export class GameLogic {
    constructor() {
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');
        this.grid = 32;
        this.playfield = [];
        this.tetromino = null;
        this.count = 0;
        this.gameOver = false;
        this.rAF = null;
        this.tetrisShape = new TetrisShape();
        this.shapeLogic = new ShapeLogic();
        this.tetrominoSequence = [];
        this.resetButton();
        this.clearedRows = 0;
        this.score = 0;
        this.holdTetromino = null;

        // Initialize high score from localStorage
        this.HighScore = localStorage.getItem('high-score') || 0;
        this.updateHighScore(this.HighScore); // Ensure high score is displayed correctly
        this.addHoldEventListener();  // Add event listener for hold functionality once
        this.initializePlayfield();
        this.initializeGame();
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

    // Initialize the game by setting up the first tetromino and starting the game loop
    initializeGame() {
        this.tetromino = this.getNextTetromino();
        this.rAF = requestAnimationFrame(this.loop.bind(this));
        this.resetGame();
    }

    // Rotate the matrix (tetromino) and check for boundary conditions
    rotate(matrix) {
        const N = matrix.length;
        const result = new Array(N).fill(0).map(() => new Array(N).fill(0));

        // Perform the rotation
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[j][N - 1 - i] = matrix[i][j];
            }
        }

        // Adjust for boundary issues
        if (!this.isValidMove(result, this.tetromino.row, this.tetromino.col)) {
            return matrix; // Return the original matrix if invalid
        }

        return result;
    }

    // Check if a move is valid by passing the matrix, row, and column
    isValidMove(matrix, cellRow, cellCol) {
        return this.shapeLogic.isValidMove(matrix, cellRow, cellCol, this.playfield);
    }

    // Get the next tetromino from the sequence
    getNextTetromino() {
        if (this.tetrominoSequence.length === 0) {
            this.shapeLogic.generateSequence(this.tetrominoSequence);
        }

        const name = this.tetrominoSequence.pop();
        const matrix = this.tetrisShape.getTetromino(name);
        const col = this.playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
        const row = name === 'I' ? -1 : -2;

        return { name, matrix, row, col };
    }

    // Add event listener for hold functionality (only once)
    addHoldEventListener() {
        document.addEventListener('keydown', (event) => {
            if (event.shiftKey) {
                this.hold();
            }
        });
    }

    // Handle the hold action for tetrominoes
    hold() {
        if (!this.holdTetromino) {
            this.holdTetromino = this.tetromino;
            this.tetromino = this.getNextTetromino();
        } else {
            const temp = this.tetromino;
            this.tetromino = this.holdTetromino;
            this.holdTetromino = temp;
        }
        this.drawTetromino(this.tetromino, this.context);
        this.drawTetromino(this.holdTetromino, this.hold.getContext('2d')); // Display tetromino to hold
    }

    // Place the tetromino on the playfield and check for full rows
    placeTetromino() {
        for (let row = 0; row < this.tetromino.matrix.length; row++) {
            for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
                if (this.tetromino.matrix[row][col]) {
                    if (this.tetromino.row + row < 0) {
                        return this.showGameOver(); // Game over if tetromino reaches the top
                    }
                    this.playfield[this.tetromino.row + row][this.tetromino.col + col] = this.tetromino.name;
                }
            }
        }
        this.checkForFullRows();
        this.tetromino = this.getNextTetromino(); // Get the next tetromino after placing one
    }

    // Check for full rows and clear them
    checkForFullRows() {
        let clearedRows = 0;
        let score = this.score;
        let HighScore = this.HighScore;

        for (let row = this.playfield.length - 1; row >= 0;) {
            if (this.playfield[row].every(cell => !!cell)) {
                clearedRows++;
                this.playfield.splice(row, 1);
                this.playfield.unshift(Array(10).fill(0));
                score += this.calculateScore(clearedRows);
                this.updateScore(score);

                if (clearedRows > HighScore) {
                    HighScore = clearedRows;
                    this.updateHighScore(HighScore);
                }
            } else {
                row--;
            }
        }
    }

    // Display the game over screen
    showGameOver() {
        cancelAnimationFrame(this.rAF);
        this.gameOver = true;
        this.context.fillStyle = 'black';
        this.context.globalAlpha = 0.75;
        this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        this.context.fillStyle = 'white';
        this.context.font = '36px monospace';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText('GAME OVER!', this.canvas.width / 2, this.canvas.height / 2);

        // Update HighScore if necessary
        if (this.score >= this.HighScore) {
            this.updateHighScore(this.score);
        }

        this.resetButton();
    }

    // Reset the game state and start a new game
    resetGame() {
        this.playfield.splice(-2); // Remove last two rows
        this.initializePlayfield();
        this.tetrominoSequence.length = 0;
        this.tetromino = this.getNextTetromino();
        this.count = 0;
        this.gameOver = false;
        this.updateScore(0);
        if (this.rAF) {
            cancelAnimationFrame(this.rAF);
        }
        this.rAF = requestAnimationFrame(this.loop.bind(this)); // Start game loop
    }

    // Handle the reset button logic
    resetButton() {
        const resetButton = document.getElementById('reset-btn');
        resetButton.addEventListener('click', () => {
            this.resetGame();
            resetButton.blur(); // Remove active state
        });
    }

    // Update the score on the UI
    updateScore(score) {
        const scoreElement = document.getElementById('score-value');
        scoreElement.textContent = score;
        this.score = score;

        const HighScore = localStorage.getItem('high-score') || 0;
        if (score > HighScore) {
            localStorage.setItem('high-score', score);
            this.updateHighScore(score);
        }
    }

    // Update the high score if it's greater than the previous value
    updateHighScore(highScore) {
        const highScoreElement = document.getElementById("high-score"); // Ensure this element exists
        const highScoreText = "High-score";
        highScoreElement.textContent = highScoreText;
        if (highScoreElement) {
            highScoreElement.textContent = highScore; // Update the display
        }

        // Update in localStorage if necessary
        if (highScore > this.HighScore) {
            this.HighScore = highScore;
            localStorage.setItem('high-score', highScore);
        }
    }

    // Calculate the score based on the number of rows cleared
    calculateScore(clearedRows) {
        const baseScore = [0, 20, 60, 100, 300];
        return baseScore[clearedRows];
    }

    // Game loop that updates the canvas and checks for tetromino movement
    loop() {
        this.rAF = requestAnimationFrame(this.loop.bind(this));
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the playfield
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                if (this.playfield[row][col]) {
                    const name = this.playfield[row][col];
                    this.context.fillStyle = this.tetrisShape.getColor(name);
                    this.context.fillRect(col * this.grid, row * this.grid, this.grid - 1, this.grid - 1);
                }
            }
        }

        // Draw the current tetromino
        if (this.tetromino) {
            if (++this.count > 60) {
                this.tetromino.row++;
                this.count = 0;
                if (!this.isValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col)) {
                    this.tetromino.row--;
                    this.placeTetromino();
                }
            }

            this.drawShadow();
            this.context.fillStyle = this.tetrisShape.getColor(this.tetromino.name);
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
    }

    // Draw the shadow of the current tetromino
    drawShadow() {
        let shadowRow = this.calculateShadowRow();
        for (let row = 0; row < this.tetromino.matrix.length; row++) {
            for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
                if (this.tetromino.matrix[row][col]) {
                    this.context.fillStyle = 'rgba(0, 0, 0, 0.3)';
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

    // Calculate the shadow row for the current tetromino
    calculateShadowRow() {
        let shadowRow = this.tetromino.row;
        while (this.isValidMove(this.tetromino.matrix, shadowRow + 1, this.tetromino.col)) {
            shadowRow++;
        }
        return shadowRow;
    }
     moveDown() {
        const row = this.tetromino.row + 1;
        if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
            this.tetromino.row = row - 1;
            this.placeTetromino();
            return;
        }
        this.tetromino.row = row;
    }
    drop() {
        for (let row = this.tetromino.row + 1; row < this.playfield.length; row++) {
            if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
                this.tetromino.row = row - 1;
                break;
            }
            this.tetromino.row = row;
        }
    }
}

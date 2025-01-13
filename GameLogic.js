// GameLogic.js
import { TetrisShape } from './TetrisShape.js';
import { ShapeLogic } from './shapelogic.js';

export class GameLogic {
    constructor() {
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');
        this.highScore = parseInt(localStorage.getItem('high-score')) || 0;
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

        // Initialize the playfield (clear all cells)
        for (let row = -2; row < 20; row++) {
            this.playfield[row] = [];
            for (let col = 0; col < 10; col++) {
                this.playfield[row][col] = 0;
            }
        }

        this.resetGame();
    }

    rotate(matrix) {
        return this.shapeLogic.rotate(matrix);
    }

    isValidMove(matrix, cellRow, cellCol) {
        return this.shapeLogic.isValidMove(matrix, cellRow, cellCol, this.playfield);
    }

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

    startGame() {
        this.generateTetrominoInterval();
        this.placeTetromino();
    }

    generateTetromino() {
        let tetromino2 = this.getNextTetromino(); // Get next tetromino
        let tetromino1 = JSON.parse(JSON.stringify(tetromino2)); // Create a deep copy of the tetromino
    
        if (!this.currentTetromino) {
            this.currentTetromino = tetromino1;
            this.nextTetromino = tetromino2;
        } else {
            this.currentTetromino = tetromino2;
            this.nextTetromino = this.getNextTetromino();
        }
    
        return [this.currentTetromino, this.nextTetromino];
    }    
    
    placeTetromino() {
        // Ensure currentTetromino is initialized if it's not already
        if (!this.currentTetromino) {
            this.currentTetromino = this.getNextTetromino();  // Get the first tetromino
        }
    
        let nextTetromino = this.getNextTetromino(); // Get the next tetromino
    
        // Check for game over only if placing the current tetromino is not possible
        let collisionDetected = false;
        for (let row = 0; row < this.currentTetromino.matrix.length; row++) {
            for (let col = 0; col < this.currentTetromino.matrix[row].length; col++) {
            if (this.currentTetromino.matrix[row][col]) {
                // If the block goes out of bounds or collides with existing blocks, trigger game over
                if (this.currentTetromino.row + row < 0 || this.playfield[this.currentTetromino.row + row][this.currentTetromino.col + col] !== 0) {
                collisionDetected = true;
                break;
                }
            }
            }
            if (collisionDetected) break;
        }
        
        if (collisionDetected || this.currentTetromino.row < 0) {
            return this.showGameOver();  // Trigger game over if there's a collision or tetromino reaches the top
        }
    
         // Render the current tetromino shape visually
         const currentContainer = document.getElementById('current');
         currentContainer.innerHTML = '';  // Clear the previous content
     
         const matrix = this.currentTetromino.matrix;
     
         // Create a grid for the current tetromino shape
         for (let row = 0; row < matrix.length; row++) {
             const rowElement = document.createElement('div');
             rowElement.style.display = 'flex';  // Row as a flex container
     
             for (let col = 0; col < matrix[row].length; col++) {
                 const cellElement = document.createElement('div');
                 cellElement.style.width = '20px';  // Set width for each block
                 cellElement.style.height = '20px';  // Set height for each block
                 cellElement.style.margin = '1px';  // Small space between blocks
     
                 // If there is a block at this position, color it
                 if (matrix[row][col]) {
                     cellElement.style.backgroundColor = this.tetrisShape.getColor(this.currentTetromino.name);
                 } else {
                     cellElement.style.backgroundColor = 'transparent';  // Empty space
                 }
     
                 rowElement.appendChild(cellElement);
             }
     
             currentContainer.appendChild(rowElement);
         }
     
         // Update the "current" tetromino name (optional, you can keep this for debugging or visual purposes)
         document.getElementById('current').setAttribute('data-tetromino-name', this.currentTetromino.name);
    
        // Place the current tetromino on the playfield
        for (let row = 0; row < this.currentTetromino.matrix.length; row++) {
            for (let col = 0; col < this.currentTetromino.matrix[row].length; col++) {
                if (this.currentTetromino.matrix[row][col]) {
                    this.playfield[this.currentTetromino.row + row][this.currentTetromino.col + col] = this.currentTetromino.name;
                }
            }
        }
    
        // After placing, move to the next tetromino
        this.currentTetromino = nextTetromino;
        
        // Check if tetromino1 has touched the bottom or dropped
        if (collisionDetected) {
            this.currentTetromino = tetromino2;
            this.nextTetromino = this.getNextTetromino();
        }
    }
    
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

        // Update high score when game ends
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScore(this.highScore);
        }

        this.resetButton();
    }

    updateHighScore(value) {
        // Update the high score display
        const highScoreElement = document.getElementById('high-score-value');
        if (highScoreElement) {
            highScoreElement.textContent = value;
        }
    
        // Store the new high score in localStorage if it is higher
        const currentHighScore = parseInt(localStorage.getItem('high-score')) || 0;
        if (value > currentHighScore) {
            localStorage.setItem('high-score', value);
        }
    }    

    resetButton() {
        const resetButton = document.getElementById('reset-btn');
        
        // Define the event listener function
        const resetButtonClick = () => {
            this.resetGame();
            resetButton.removeEventListener('click', resetButtonClick);
            resetButton.blur(); // Remove active state
        };

        // Remove any existing event listener before adding a new one
        resetButton.removeEventListener('click', resetButtonClick);
        resetButton.addEventListener('click', resetButtonClick);

        this.updateHighScore(this.highScore);
    }

    updateScore(score) {
        const scoreElement = document.getElementById('score-value');
        scoreElement.textContent = score;
        this.score = score;

        if (score > this.highScore) {
            this.highScore = score;
            this.updateHighScore(this.highScore);
        }
    }

    resetGame() {
        this.playfield.splice(-2);
        for (let row = -2; row < 20; row++) {
            this.playfield[row] = [];
            for (let col = 0; col < 10; col++) {
                this.playfield[row][col] = 0;
            }
        }

        this.tetrominoSequence.length = 0;
        this.tetromino = this.getNextTetromino();
        this.count = 0;
        this.gameOver = false;
        this.updateScore(0);

        if (this.rAF) {
            cancelAnimationFrame(this.rAF);
            this.rAF = null;
        }
        this.rAF = requestAnimationFrame(this.loop.bind(this));
    }

    loop() {
        this.rAF = requestAnimationFrame(this.loop.bind(this));
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                if (this.playfield[row][col]) {
                    const name = this.playfield[row][col];
                    this.context.fillStyle = this.tetrisShape.getColor(name);
                    this.context.fillRect(col * this.grid, row * this.grid, this.grid - 1, this.grid - 1);
                }
            }
        }

        if (this.tetromino) {
            if (++this.count > 35) { // Adjust this for speed control
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

    calculateScore(clearedRows) {
        const baseScore = [0, 40, 100, 300, 1200];
        return baseScore[clearedRows];
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

    drawShadow() {
        let shadowRow = this.tetromino.row;

        while (this.isValidMove(this.tetromino.matrix, shadowRow + 1, this.tetromino.col)) {
            shadowRow++;
        }

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
}

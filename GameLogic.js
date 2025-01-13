// GameLogic.js
import { TetrisShape } from './TetrisShape.js';
import { ShapeLogic } from './shapelogic.js';

export class GameLogic {
    constructor() {
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');
        this.HighScore = localStorage.getItem('high-score');
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

    // Get the next tetromino from the tetromino sequence
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

    showNextTetromino(tetromino) {
        
    }

    placeTetromino() {
        for (let row = 0; row < this.tetromino.matrix.length; row++) {
            for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
                if (this.tetromino.matrix[row][col]) {
                    if (this.tetromino.row + row < 0) {
                        return this.showGameOver();
                    }

                    this.playfield[this.tetromino.row + row][this.tetromino.col + col] = this.tetromino.name;
                }
            }
        }
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

                if (clearedRows > score) {
                    HighScore = clearedRows;
                    this.updateHighScore(HighScore);
                }
            } else {
                row--;
            }
        }

        this.tetromino = this.getNextTetromino();
    }

    showGameOver() {
        let HighScore = this.HighScore; 
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

        if (this.score > HighScore) {
            HighScore = this.score;
            this.updateHighScore(HighScore);
        }

        this.resetButton();
    }

    updateHighScore(value) {
        const highScoreElement = document.getElementById('high-score-value');
        if (highScoreElement) {
            highScoreElement.textContent = value;
        }
    }

    resetButton() {
        const resetButton = document.getElementById('reset-btn');
        resetButton.addEventListener('click', () => {
            this.resetGame();
            resetButton.removeEventListener('click', resetButtonClick);
            resetButton.blur(); // Remove active state
        });

        const resetButtonClick = () => {
            this.resetGame();
            resetButton.removeEventListener('click', resetButtonClick);
            resetButton.blur(); // Remove active state
        };
        
        this.updateHighScore(this.HighScore);
        resetButton.addEventListener('click', resetButtonClick);
    }

    updateScore(score) {
        const scoreElement = document.getElementById('score-value');
        scoreElement.textContent = score;
        this.score = score;

        if (score > this.HighScore) {
            this.HighScore = score;
            localStorage.setItem('highScore', this.HighScore);
            this.updateHighScore(this.HighScore);
        }
    }

    updateHighScore(value) {
        const highScoreElement = document.getElementById('high-score-value');
            if (highScoreElement) {
                highScoreElement.textContent = value;
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

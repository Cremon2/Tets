// main.js
import { GameLogic } from './gamelogic.js';

export class Main {
    constructor() {
        this.gameLogic = new GameLogic();
        this.initializeGame();
    }

    initializeGame() {
        this.gameLogic.resetGame();
        this.gameLogic.updateScore(0);
        this.gameLogic.rAF = requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop() {
        this.gameLogic.loop();
    }
}

const game = new Main();

// Input handling for key events
document.addEventListener('keydown', function (e) {
    const gameLogic = game.gameLogic; // Get game logic instance

    if (gameLogic.gameOver) return;

    // Left and right arrow keys (move)
    if (e.which === 37 || e.which === 39) {
        const col = e.which === 37 ? gameLogic.tetromino.col - 1 : gameLogic.tetromino.col + 1;

        if (gameLogic.isValidMove(gameLogic.tetromino.matrix, gameLogic.tetromino.row, col)) {
            gameLogic.tetromino.col = col;
        }
    }

    // Up arrow key (rotate)
    if (e.which === 38) {
        const matrix = gameLogic.rotate(gameLogic.tetromino.matrix);
        if (gameLogic.isValidMove(matrix, gameLogic.tetromino.row, gameLogic.tetromino.col)) {
            gameLogic.tetromino.matrix = matrix;
        }
    }

    // Down arrow key (move down)
    if (e.which === 40) {
        gameLogic.moveDown();
    }

    // Spacebar (drop)
    if (e.which === 32) {
        gameLogic.drop();
    }
});
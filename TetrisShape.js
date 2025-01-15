// TetrisShape.js
export class TetrisShape {
    constructor() {
        this.colors = {
            'I': 'cyan',
            'O': 'yellow',
            'T': 'purple',
            'S': 'green',
            'Z': 'red',
            'J': 'blue',
            'L': 'orange'
        };
        
        this.tetrominos = {
            'I': [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            'J': [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0],
            ],
            'L': [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0],
            ],
            'O': [
                [1, 1],
                [1, 1],
            ],
            'S': [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0],
            ],
            'Z': [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0],
            ],
            'T': [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0],
            ]
        };
    }

    getTetromino(name) {
        return this.tetrominos[name];
    }

    getColor(name) {
        return this.colors[name];
    }
}

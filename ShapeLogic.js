// ShapeLogic.js
export class ShapeLogic {
    rotate(matrix) {
        const N = matrix.length - 1;
        return matrix.map((row, i) =>
            row.map((val, j) => matrix[N - j][i])
        );
    }

    isValidMove(matrix, cellRow, cellCol, playfield) {
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col] && (
                    cellCol + col < 0 ||
                    cellCol + col >= playfield[0].length ||
                    cellRow + row >= playfield.length ||
                    playfield[cellRow + row][cellCol + col]
                )) {
                    return false;
                }
            }
        }
        return true;
    }

    generateSequence(sequence) {
        const shapes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        while (shapes.length) {
            const rand = Math.floor(Math.random() * shapes.length);
            sequence.push(shapes.splice(rand, 1)[0]);
        }
    }
}

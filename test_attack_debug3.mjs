import { createInitialState, isSquareAttacked } from './js/game.js';

console.log("=== Debug: Attack detection - correct direction ===");
let state = createInitialState();

// Clear the board except for queen and king
state.board = Array(8).fill(null).map(() => Array(8).fill(null));
state.board[3][3] = { type: 'q', color: 'w' };  // Queen on d5 (row 3, col 3)
state.board[0][4] = { type: 'k', color: 'b' };  // King on e8 (row 0, col 4)

console.log("Board:");
for (let r = 0; r < 8; r++) {
    let rowStr = '';
    for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (piece) {
            rowStr += `${piece.color === 'w' ? piece.type.toUpperCase() : piece.type} `;
        } else {
            rowStr += '. ';
        }
    }
    console.log(`${8-r}: ${rowStr}`);
}
console.log("   a b c d e f g h");

console.log("\nQueen at (3,3), King at (0,4)");
console.log("To go from King to Queen: row increases (+1,+2,+3), col decreases (-1)");
console.log("So direction should be (1, -1)... but we need to check all diagonals\n");

// Manually trace ALL diagonals from king position
const diagonalDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
for (const [dRow, dCol] of diagonalDirections) {
    console.log(`Direction (${dRow},${dCol}):`);
    let r = 0 + dRow;
    let c = 4 + dCol;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const piece = state.board[r][c];
        console.log(`  (${r},${c}): ${piece ? (piece.color === 'w' ? piece.type.toUpperCase() : piece.type) : '.'}`);
        if (piece) break;
        r += dRow;
        c += dCol;
    }
}

// Check if e8 is attacked by white
const isAttacked = isSquareAttacked(state, 0, 4, 'b');
console.log(`\nIs e8 attacked? ${isAttacked}`);

// Now test with queen in correct diagonal position
console.log("\n\n=== Test with queen at (1,3) which is on diagonal ===");
state.board[3][3] = null;
state.board[1][3] = { type: 'q', color: 'w' };  // Queen on d7 (row 1, col 3)

console.log("Board:");
for (let r = 0; r < 8; r++) {
    let rowStr = '';
    for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (piece) {
            rowStr += `${piece.color === 'w' ? piece.type.toUpperCase() : piece.type} `;
        } else {
            rowStr += '. ';
        }
    }
    console.log(`${8-r}: ${rowStr}`);
}

const isAttacked2 = isSquareAttacked(state, 0, 4, 'b');
console.log(`\nIs e8 attacked now? ${isAttacked2}`);

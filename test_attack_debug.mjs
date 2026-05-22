import { createInitialState, generateLegalMoves, makeMove, isSquareAttacked } from './js/game.js';

console.log("=== Debug: Attack detection ===");
let state = createInitialState();

// Set up a simple position - queen directly attacking king with no obstructions
// Place white queen on d5 (row 3, col 3) and black king on e8 (row 0, col 4)

// Create custom board state
state.board[3][3] = { type: 'q', color: 'w' };  // Queen on d5
state.board[0][4] = { type: 'k', color: 'b' };  // King on e8 (already there)
state.board[6][4] = null;  // Remove white pawn from e2
state.board[7][3] = null;  // Remove white queen from d1

console.log("Custom position: White queen on d5, Black king on e8");
console.log("\nBoard:");
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

// Check if e8 is attacked by white
const isAttacked = isSquareAttacked(state, 0, 4, 'b');
console.log(`\nIs e8 (black king) attacked by white? ${isAttacked}`);

// Test diagonal attack detection manually
console.log("\nChecking diagonal from e8 (0,4) towards d5 (3,3):");
const diagonalDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
for (const [dRow, dCol] of diagonalDirections) {
    let r = 0 + dRow;
    let c = 4 + dCol;
    console.log(`Direction (${dRow},${dCol}):`);
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const piece = state.board[r][c];
        console.log(`  (${r},${c}): ${piece ? (piece.color === 'w' ? piece.type.toUpperCase() : piece.type) : '.'}`);
        if (piece) break;
        r += dRow;
        c += dCol;
    }
}

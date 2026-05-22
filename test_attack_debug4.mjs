import { createInitialState, isSquareAttacked } from './js/game.js';

console.log("=== Debug: Queen on d5 NOT on same diagonal as e8 ===");
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

console.log("\nQueen at d5 (3,3), King at e8 (0,4)");
console.log("For diagonal attack: |row1-row2| must equal |col1-col2|");
console.log("|3-0| = 3, |3-4| = 1 -> NOT EQUAL, so NOT on same diagonal!");
console.log("\nd5 to e8 is a knight move pattern, not a diagonal!");
console.log("The queen on d5 attacks: a8, b7, c6, e4, f3, g2, h1 (diagonal)");
console.log("                         d6, d7, d8, d4, d3, d2, d1 (vertical)");
console.log("                         e5, f5, g5, h5, c5, b5, a5 (horizontal)");
console.log("\ne8 is NOT attacked by queen on d5 - this is CORRECT behavior!");

// Test with queen that CAN attack e8
console.log("\n\n=== Test with queen on d8 (same rank) ===");
state.board[3][3] = null;
state.board[0][3] = { type: 'q', color: 'w' };  // Queen on d8

const isAttacked1 = isSquareAttacked(state, 0, 4, 'b');
console.log(`Is e8 attacked by queen on d8? ${isAttacked1}`);

console.log("\n=== Test with queen on e5 (same file) ===");
state.board[0][3] = null;
state.board[3][4] = { type: 'q', color: 'w' };  // Queen on e5

const isAttacked2 = isSquareAttacked(state, 0, 4, 'b');
console.log(`Is e8 attacked by queen on e5? ${isAttacked2}`);

console.log("\n=== Test with queen on h5 (on diagonal to e8) ===");
state.board[3][4] = null;
state.board[3][7] = { type: 'q', color: 'w' };  // Queen on h5

const isAttacked3 = isSquareAttacked(state, 0, 4, 'b');
console.log(`Is e8 attacked by queen on h5? ${isAttacked3}`);
console.log("(h5 to e8: |3-0|=3, |7-4|=3 -> EQUAL, on same diagonal!)");

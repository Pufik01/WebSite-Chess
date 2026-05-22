import { createInitialState, isSquareAttacked } from './js/game.js';

console.log("=== Debug: Attack detection - direction (1,-1) ===");
let state = createInitialState();

// Clear the board except for queen and king
state.board = Array(8).fill(null).map(() => Array(8).fill(null));
state.board[3][3] = { type: 'q', color: 'w' };  // Queen on d5
state.board[0][4] = { type: 'k', color: 'b' };  // King on e8

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

// Check if e8 is attacked by white
const isAttacked = isSquareAttacked(state, 0, 4, 'b');
console.log(`\nIs e8 (black king) attacked by white? ${isAttacked}`);

// Manually trace diagonal (1,-1) from king position
console.log("\nManually checking diagonal (1,-1) from e8 (0,4):");
let r = 0 + 1;
let c = 4 - 1;
while (r >= 0 && r < 8 && c >= 0 && c < 8) {
    const piece = state.board[r][c];
    console.log(`  Checking (${r},${c}): ${piece ? (piece.color === 'w' ? piece.type.toUpperCase() : piece.type) : '.'}`);
    if (piece) {
        if (piece.color === 'w' && (piece.type === 'b' || piece.type === 'q')) {
            console.log(`    -> ATTACK DETECTED!`);
        }
        break;
    }
    r += 1;
    c -= 1;
}

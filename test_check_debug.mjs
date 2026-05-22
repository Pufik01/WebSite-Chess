import { createInitialState, generateLegalMoves, makeMove, isInCheck, isSquareAttacked } from './js/game.js';

console.log("=== Debug: Check detection ===");
let state = createInitialState();

// Set up a position where queen can give check
let moves = generateLegalMoves(state);

// 1. e2-e4
let move1 = moves.find(m => m.from.row === 6 && m.from.col === 4 && m.to.row === 4);
state = makeMove(state, move1);

// 1... e7-e5
moves = generateLegalMoves(state);
let move2 = moves.find(m => m.from.row === 1 && m.from.col === 4 && m.to.row === 3);
state = makeMove(state, move2);

// 2. Qh5 (queen to h5)
moves = generateLegalMoves(state);
let move3 = moves.find(m => m.piece.type === 'q' && m.to.row === 3 && m.to.col === 7);
if (move3) {
    console.log("Moving queen to h5...");
    state = makeMove(state, move3);
    
    // Black king is at (0, 4) - row 0, col 4 (e8)
    // White queen is at (3, 7) - row 3, col 7 (h5)
    
    console.log("\nChecking if black king on e8 (0,4) is attacked...");
    const isAttacked = isSquareAttacked(state, 0, 4, 'b');
    console.log(`Is e8 attacked: ${isAttacked}`);
    
    // Manually check the diagonal from queen to king
    console.log("\nBoard state around queen and king:");
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
    
    // Check diagonal from h5 to e8
    console.log("\nDiagonal from h5 (3,7) towards e8 (0,4):");
    let r = 3, c = 7;
    while (r >= 0 && c >= 0) {
        const piece = state.board[r][c];
        console.log(`  (${r},${c}): ${piece ? (piece.color === 'w' ? piece.type.toUpperCase() : piece.type) : '.'}`);
        r--;
        c--;
    }
}

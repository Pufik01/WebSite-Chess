import { createInitialState, generateLegalMoves } from './js/game.js';

console.log("=== Debug: All moves ===");
let state = createInitialState();
const moves = generateLegalMoves(state);

console.log(`Total moves: ${moves.length}`);

// Check all black pawn moves
console.log("\nBlack pawn moves:");
const blackPawnMoves = moves.filter(m => 
    m.piece.color === 'b' && 
    m.piece.type === 'p'
);
console.log(`Count: ${blackPawnMoves.length}`);
blackPawnMoves.slice(0, 5).forEach(m => {
    console.log(`  From (${m.from.row},${m.from.col}) to (${m.to.row},${m.to.col}), double: ${!!m.isDoublePawnPush}`);
});

// Check if white queen has moves
console.log("\nWhite queen moves:");
const whiteQueenMoves = moves.filter(m => 
    m.piece.color === 'w' && 
    m.piece.type === 'q'
);
console.log(`Count: ${whiteQueenMoves.length}`);
whiteQueenMoves.slice(0, 5).forEach(m => {
    console.log(`  From (${m.from.row},${m.from.col}) to (${m.to.row},${m.to.col})`);
});

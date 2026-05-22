import { createInitialState, generateLegalMoves, makeMove, isInCheck } from './js/game.js';

console.log("=== Test: Check detection ===");
let state = createInitialState();

// Set up a position where queen can give check
// Starting position: white queen on d1, black king on e8
// Move queen to h5, then see if it can attack e8

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
    
    // Now check if black king is in check
    const isBlackInCheck = isInCheck(state, 'b');
    console.log(`Black king in check: ${isBlackInCheck}`);
    
    // Show all black moves
    const blackMoves = generateLegalMoves(state);
    console.log(`Black has ${blackMoves.length} legal moves`);
    
    // Check if any queen moves can attack the king
    const queenMoves = blackMoves.filter(m => m.piece.type === 'q');
    console.log(`Black queen moves: ${queenMoves.length}`);
} else {
    console.log("Cannot move queen to h5");
    // Show available queen moves
    const queenMoves = moves.filter(m => m.piece.type === 'q');
    console.log(`Available queen moves: ${queenMoves.length}`);
    queenMoves.forEach(m => {
        console.log(`  Queen to (${m.to.row},${m.to.col})`);
    });
}

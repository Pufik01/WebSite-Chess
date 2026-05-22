import { createInitialState, generateLegalMoves, makeMove } from './js/game.js';

console.log("=== Test: Queen giving check ===");
let state = createInitialState();

// Make some moves to open up the position
let moves = generateLegalMoves(state);

// e2-e4
let move1 = moves.find(m => m.from.row === 6 && m.from.col === 4 && m.to.row === 4);
state = makeMove(state, move1);

// e7-e5
let blackMoves = generateLegalMoves(state);
let move2 = blackMoves.find(m => m.from.row === 1 && m.from.col === 4 && m.to.row === 3);
state = makeMove(state, move2);

// d2-d4
moves = generateLegalMoves(state);
let move3 = moves.find(m => m.from.row === 6 && m.from.col === 3 && m.to.row === 4);
state = makeMove(state, move3);

// exd4
blackMoves = generateLegalMoves(state);
let move4 = blackMoves.find(m => m.from.row === 3 && m.from.col === 4 && m.to.row === 4 && m.capture);
state = makeMove(state, move4);

// Qxd4
moves = generateLegalMoves(state);
let move5 = moves.find(m => m.piece.type === 'q' && m.to.row === 4 && m.to.col === 3);
if (move5) {
    console.log("Found queen capture move!");
    state = makeMove(state, move5);
    
    // Now check if queen can give check
    const newMoves = generateLegalMoves(state);
    const queenMoves = newMoves.filter(m => m.piece.type === 'q');
    console.log(`Queen moves after Qxd4: ${queenMoves.length}`);
    
    // Check if any queen move attacks the king
    queenMoves.forEach(m => {
        console.log(`  Queen from (${m.from.row},${m.from.col}) to (${m.to.row},${m.to.col})`);
    });
} else {
    console.log("No queen capture found");
}

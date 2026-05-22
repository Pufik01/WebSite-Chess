import { createInitialState, generateLegalMoves } from './js/game.js';

console.log("=== Debug: Turn ===");
let state = createInitialState();
console.log(`Initial turn: ${state.turn}`);

const moves = generateLegalMoves(state);
console.log(`Total moves for white: ${moves.length}`);

// Now simulate black's turn by making a move
import { makeMove } from './js/game.js';

// Make e2-e4
const e4move = moves.find(m => m.from.row === 6 && m.from.col === 4 && m.to.row === 4);
if (e4move) {
    const newState = makeMove(state, e4move);
    console.log(`\nAfter e4, turn: ${newState.turn}`);
    
    const blackMoves = generateLegalMoves(newState);
    console.log(`Total moves for black: ${blackMoves.length}`);
    
    // Show black pawn moves
    const blackPawnMoves = blackMoves.filter(m => 
        m.piece.color === 'b' && 
        m.piece.type === 'p'
    );
    console.log(`Black pawn moves: ${blackPawnMoves.length}`);
    blackPawnMoves.slice(0, 5).forEach(m => {
        console.log(`  From (${m.from.row},${m.from.col}) to (${m.to.row},${m.to.col}), double: ${!!m.isDoublePawnPush}`);
    });
}

import { createInitialState, generateLegalMoves } from './js/game.js';

console.log("=== Test 1: Black pawn double push ===");
let state = createInitialState();
const moves = generateLegalMoves(state);

// Find black pawn moves from starting position
const blackPawnMoves = moves.filter(m => 
    m.piece.color === 'b' && 
    m.piece.type === 'p' &&
    m.from.row === 1
);

const doublePushes = blackPawnMoves.filter(m => m.isDoublePawnPush);
console.log(`Black pawn double pushes available: ${doublePushes.length}`);
if (doublePushes.length > 0) {
    console.log("✓ Black pawns CAN do double push!");
    console.log("Sample moves:", doublePushes.slice(0, 3).map(m => 
        `(${m.from.row},${m.from.col}) -> (${m.to.row},${m.to.col})`
    ));
} else {
    console.log("✗ Black pawns CANNOT do double push - BUG!");
}

// Test white pawns too
const whitePawnMoves = moves.filter(m => 
    m.piece.color === 'w' && 
    m.piece.type === 'p' &&
    m.from.row === 6
);

const whiteDoublePushes = whitePawnMoves.filter(m => m.isDoublePawnPush);
console.log(`\nWhite pawn double pushes available: ${whiteDoublePushes.length}`);
if (whiteDoublePushes.length > 0) {
    console.log("✓ White pawns CAN do double push!");
} else {
    console.log("✗ White pawns CANNOT do double push - BUG!");
}

console.log("\n=== Test 2: Queen can move and potentially give check ===");
const queenMoves = moves.filter(m => 
    m.piece.color === 'w' && 
    m.piece.type === 'q'
);
console.log(`White queen moves available: ${queenMoves.length}`);
if (queenMoves.length > 0) {
    console.log("✓ Queen CAN move!");
    console.log("Sample queen moves:", queenMoves.slice(0, 5).map(m => 
        `(${m.from.row},${m.from.col}) -> (${m.to.row},${m.to.col})`
    ));
}

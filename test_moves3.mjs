import { createInitialState, generateLegalMoves } from './js/game.js';

console.log("=== Debug: All moves ===");
let state = createInitialState();
const moves = generateLegalMoves(state);

console.log(`Total moves: ${moves.length}`);

// Show all moves
console.log("\nAll moves:");
moves.forEach(m => {
    console.log(`  ${m.piece.color} ${m.piece.type} from (${m.from.row},${m.from.col}) to (${m.to.row},${m.to.col})`);
});

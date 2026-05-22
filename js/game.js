/**
 * Chess Game Logic Module
 * 
 * Implements complete chess rules including:
 * - Legal move generation for all piece types
 * - Check, checkmate, and stalemate detection
 * - Castling (kingside and queenside)
 * - En passant captures
 * - Pawn promotion
 * - Draw conditions (50-move rule, threefold repetition)
 * - Immutable state management with full history
 * 
 * @module game
 */

import {
    PIECES,
    COLORS,
    cloneGameState,
    generateFEN,
    positionsAreEqual,
    moveToSAN
} from './utils.js';

// =============================================================================
// Initial State
// =============================================================================

/**
 * Standard starting position FEN
 */
export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Create initial game state
 * 
 * @returns {Object} Initial game state
 */
export function createInitialState() {
    return {
        board: createStartingBoard(),
        turn: COLORS.WHITE,
        castlingRights: {
            [COLORS.WHITE]: { kingSide: true, queenSide: true },
            [COLORS.BLACK]: { kingSide: true, queenSide: true }
        },
        enPassantSquare: null,
        halfMoveClock: 0,
        fullMoveNumber: 1,
        moveHistory: [],
        positionHistory: [],
        isGameOver: false,
        gameOverReason: null
    };
}

/**
 * Create standard starting board position
 * 
 * @returns {Array} 8x8 board array
 */
function createStartingBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Set up pawns
    for (let col = 0; col < 8; col++) {
        board[1][col] = { type: PIECES.PAWN, color: COLORS.BLACK };
        board[6][col] = { type: PIECES.PAWN, color: COLORS.WHITE };
    }
    
    // Set up other pieces
    const pieceOrder = [PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN, PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK];
    
    for (let col = 0; col < 8; col++) {
        board[0][col] = { type: pieceOrder[col], color: COLORS.BLACK };
        board[7][col] = { type: pieceOrder[col], color: COLORS.WHITE };
    }
    
    return board;
}

// =============================================================================
// Move Generation
// =============================================================================

/**
 * Generate all legal moves for the current player
 * 
 * @param {Object} state - Current game state
 * @returns {Array} Array of legal move objects
 */
export function generateLegalMoves(state) {
    const { board, turn } = state;
    const pseudoLegalMoves = [];
    
    // Generate pseudo-legal moves for all pieces of current turn's color
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === turn) {
                const moves = generatePieceMoves(state, row, col);
                pseudoLegalMoves.push(...moves);
            }
        }
    }
    
    // Filter out moves that would leave king in check
    const legalMoves = [];
    for (const move of pseudoLegalMoves) {
        if (isMoveLegal(state, move)) {
            legalMoves.push(move);
        }
    }
    
    return legalMoves;
}

/**
 * Generate pseudo-legal moves for a specific piece
 * 
 * @param {Object} state - Current game state
 * @param {number} row - Piece row
 * @param {number} col - Piece column
 * @returns {Array} Array of move objects
 */
function generatePieceMoves(state, row, col) {
    const { board, turn, castlingRights, enPassantSquare } = state;
    const piece = board[row][col];
    
    if (!piece) return [];
    
    const moves = [];
    const opponentColor = turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    switch (piece.type) {
        case PIECES.PAWN:
            generatePawnMoves(state, row, col, moves);
            break;
        case PIECES.KNIGHT:
            generateKnightMoves(state, row, col, moves);
            break;
        case PIECES.BISHOP:
            generateBishopMoves(state, row, col, moves);
            break;
        case PIECES.ROOK:
            generateRookMoves(state, row, col, moves);
            break;
        case PIECES.QUEEN:
            generateQueenMoves(state, row, col, moves);
            break;
        case PIECES.KING:
            generateKingMoves(state, row, col, moves);
            break;
    }
    
    return moves;
}

/**
 * Generate pawn moves
 */
function generatePawnMoves(state, row, col, moves) {
    const { board, turn, enPassantSquare } = state;
    const piece = board[row][col];
    const direction = turn === COLORS.WHITE ? -1 : 1;
    const startRow = turn === COLORS.WHITE ? 6 : 3;
    const promotionRow = turn === COLORS.WHITE ? 0 : 7;
    const opponentColor = turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Single push
    const newRow = row + direction;
    if (newRow >= 0 && newRow < 8 && !board[newRow][col]) {
        if (newRow === promotionRow) {
            // Promotion moves
            [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT].forEach(promoType => {
                moves.push({
                    from: { row, col },
                    to: { row: newRow, col },
                    piece,
                    promotion: promoType
                });
            });
        } else {
            moves.push({
                from: { row, col },
                to: { row: newRow, col },
                piece
            });
            
            // Double push from starting position
            if (row === startRow) {
                const doubleRow = row + 2 * direction;
                if (!board[doubleRow][col]) {
                    moves.push({
                        from: { row, col },
                        to: { row: doubleRow, col },
                        piece,
                        isDoublePawnPush: true
                    });
                }
            }
        }
    }
    
    // Captures (diagonal)
    const captureDirections = [-1, 1];
    for (const dir of captureDirections) {
        const newCol = col + dir;
        if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
            const targetSquare = board[newRow][newCol];
            
            // Regular capture
            if (targetSquare && targetSquare.color === opponentColor) {
                if (newRow === promotionRow) {
                    [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT].forEach(promoType => {
                        moves.push({
                            from: { row, col },
                            to: { row: newRow, col: newCol },
                            piece,
                            capture: targetSquare,
                            promotion: promoType
                        });
                    });
                } else {
                    moves.push({
                        from: { row, col },
                        to: { row: newRow, col: newCol },
                        piece,
                        capture: targetSquare
                    });
                }
            }
            
            // En passant capture
            if (enPassantSquare && enPassantSquare.row === newRow && enPassantSquare.col === newCol) {
                const capturedPawnRow = row; // The pawn being captured is on the same row as the moving pawn
                moves.push({
                    from: { row, col },
                    to: { row: newRow, col: newCol },
                    piece,
                    enPassant: true,
                    capture: { type: PIECES.PAWN, color: opponentColor },
                    capturedPawnPos: { row: capturedPawnRow, col: newCol }
                });
            }
        }
    }
}

/**
 * Generate knight moves
 */
function generateKnightMoves(state, row, col, moves) {
    const { board, turn } = state;
    const piece = board[row][col];
    const opponentColor = turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    for (const [dRow, dCol] of offsets) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const targetSquare = board[newRow][newCol];
            
            if (!targetSquare) {
                moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, piece });
            } else if (targetSquare.color === opponentColor) {
                moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, piece, capture: targetSquare });
            }
        }
    }
}

/**
 * Generate sliding piece moves (bishop, rook, queen)
 */
function generateSlidingMoves(state, row, col, moves, directions) {
    const { board, turn } = state;
    const piece = board[row][col];
    const opponentColor = turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    for (const [dRow, dCol] of directions) {
        let newRow = row + dRow;
        let newCol = col + dCol;
        
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const targetSquare = board[newRow][newCol];
            
            if (!targetSquare) {
                moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, piece });
            } else {
                if (targetSquare.color === opponentColor) {
                    moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, piece, capture: targetSquare });
                }
                break; // Blocked by a piece
            }
            
            newRow += dRow;
            newCol += dCol;
        }
    }
}

function generateBishopMoves(state, row, col, moves) {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    generateSlidingMoves(state, row, col, moves, directions);
}

function generateRookMoves(state, row, col, moves) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    generateSlidingMoves(state, row, col, moves, directions);
}

function generateQueenMoves(state, row, col, moves) {
    const directions = [
        [-1, -1], [-1, 1], [1, -1], [1, 1], // Bishop-like
        [-1, 0], [1, 0], [0, -1], [0, 1]     // Rook-like
    ];
    generateSlidingMoves(state, row, col, moves, directions);
}

/**
 * Generate king moves (including castling)
 */
function generateKingMoves(state, row, col, moves) {
    const { board, turn, castlingRights } = state;
    const piece = board[row][col];
    const opponentColor = turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Regular king moves (one square in any direction)
    const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dRow, dCol] of offsets) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const targetSquare = board[newRow][newCol];
            
            if (!targetSquare) {
                moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, piece });
            } else if (targetSquare.color === opponentColor) {
                moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, piece, capture: targetSquare });
            }
        }
    }
    
    // Castling
    if (canCastle(state, turn, 'kingSide')) {
        moves.push({
            from: { row, col },
            to: { row, col: col + 2 },
            piece,
            castling: 'kingSide'
        });
    }
    
    if (canCastle(state, turn, 'queenSide')) {
        moves.push({
            from: { row, col },
            to: { row, col: col - 2 },
            piece,
            castling: 'queenSide'
        });
    }
}

/**
 * Check if castling is legal
 * 
 * @param {Object} state - Current game state
 * @param {string} color - Color of the king
 * @param {string} side - 'kingSide' or 'queenSide'
 * @returns {boolean} True if castling is legal
 */
export function canCastle(state, color, side) {
    const { board, castlingRights } = state;
    
    // Check castling rights
    if (!castlingRights[color][side]) {
        return false;
    }
    
    const row = color === COLORS.WHITE ? 7 : 0;
    const kingCol = 4;
    
    // King must be on starting square
    const king = board[row][kingCol];
    if (!king || king.type !== PIECES.KING || king.color !== color) {
        return false;
    }
    
    if (side === 'kingSide') {
        // Kingside: check squares f and g are empty
        if (board[row][5] || board[row][6]) {
            return false;
        }
        
        // Rook must be on h-file
        const rook = board[row][7];
        if (!rook || rook.type !== PIECES.ROOK || rook.color !== color) {
            return false;
        }
        
        // King cannot pass through or end on attacked squares
        if (isSquareAttacked(state, row, 4, color) ||
            isSquareAttacked(state, row, 5, color) ||
            isSquareAttacked(state, row, 6, color)) {
            return false;
        }
    } else {
        // Queenside: check squares b, c, d are empty
        if (board[row][1] || board[row][2] || board[row][3]) {
            return false;
        }
        
        // Rook must be on a-file
        const rook = board[row][0];
        if (!rook || rook.type !== PIECES.ROOK || rook.color !== color) {
            return false;
        }
        
        // King cannot pass through or end on attacked squares
        if (isSquareAttacked(state, row, 4, color) ||
            isSquareAttacked(state, row, 3, color) ||
            isSquareAttacked(state, row, 2, color)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Check if a square is attacked by the opponent
 * 
 * @param {Object} state - Current game state
 * @param {number} row - Square row
 * @param {number} col - Square column
 * @param {string} defendingColor - Color of the defender
 * @returns {boolean} True if square is attacked
 */
export function isSquareAttacked(state, row, col, defendingColor) {
    const { board } = state;
    const attackingColor = defendingColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Check for pawn attacks
    const pawnDirection = defendingColor === COLORS.WHITE ? -1 : 1;
    const pawnAttackCols = [col - 1, col + 1];
    const pawnAttackRow = row + pawnDirection;
    
    for (const attackCol of pawnAttackCols) {
        if (attackCol >= 0 && attackCol < 8 && pawnAttackRow >= 0 && pawnAttackRow < 8) {
            const piece = board[pawnAttackRow][attackCol];
            if (piece && piece.type === PIECES.PAWN && piece.color === attackingColor) {
                return true;
            }
        }
    }
    
    // Check for knight attacks
    const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    for (const [dRow, dCol] of knightOffsets) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const piece = board[newRow][newCol];
            if (piece && piece.type === PIECES.KNIGHT && piece.color === attackingColor) {
                return true;
            }
        }
    }
    
    // Check for king attacks
    const kingOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dRow, dCol] of kingOffsets) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const piece = board[newRow][newCol];
            if (piece && piece.type === PIECES.KING && piece.color === attackingColor) {
                return true;
            }
        }
    }
    
    // Check for sliding piece attacks (rook, bishop, queen)
    const straightDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const diagonalDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    
    // Check straight lines (rook/queen)
    for (const [dRow, dCol] of straightDirections) {
        let newRow = row + dRow;
        let newCol = col + dCol;
        
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const piece = board[newRow][newCol];
            if (piece) {
                if (piece.color === attackingColor && 
                    (piece.type === PIECES.ROOK || piece.type === PIECES.QUEEN)) {
                    return true;
                }
                break; // Blocked
            }
            newRow += dRow;
            newCol += dCol;
        }
    }
    
    // Check diagonals (bishop/queen)
    for (const [dRow, dCol] of diagonalDirections) {
        let newRow = row + dRow;
        let newCol = col + dCol;
        
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const piece = board[newRow][newCol];
            if (piece) {
                if (piece.color === attackingColor && 
                    (piece.type === PIECES.BISHOP || piece.type === PIECES.QUEEN)) {
                    return true;
                }
                break; // Blocked
            }
            newRow += dRow;
            newCol += dCol;
        }
    }
    
    return false;
}

// =============================================================================
// Move Validation & Execution
// =============================================================================

/**
 * Check if a move is legal (doesn't leave king in check)
 * 
 * @param {Object} state - Current game state
 * @param {Object} move - Move to validate
 * @returns {boolean} True if move is legal
 */
function isMoveLegal(state, move) {
    const newState = makeMove(state, move, true); // true = test mode (don't update history)
    return !isInCheck(newState, newState.turn);
}

/**
 * Make a move and return new state (immutable)
 * 
 * @param {Object} state - Current game state
 * @param {Object} move - Move to execute
 * @param {boolean} testMode - If true, don't update history (for validation)
 * @returns {Object} New game state
 */
export function makeMove(state, move, testMode = false) {
    const newState = cloneGameState(state);
    const { board } = newState;
    const { from, to, piece, capture, enPassant, castling, promotion, capturedPawnPos } = move;
    
    // Clear the source square
    board[from.row][from.col] = null;
    
    // Handle en passant capture
    if (enPassant && capturedPawnPos) {
        board[capturedPawnPos.row][capturedPawnPos.col] = null;
    }
    
    // Handle castling
    if (castling) {
        const row = from.row;
        if (castling === 'kingSide') {
            // Move rook from h-file to f-file
            board[row][7] = null;
            board[row][5] = { type: PIECES.ROOK, color: piece.color };
        } else {
            // Move rook from a-file to d-file
            board[row][0] = null;
            board[row][3] = { type: PIECES.ROOK, color: piece.color };
        }
    }
    
    // Place piece on destination square
    const movedPiece = promotion 
        ? { type: promotion, color: piece.color }
        : piece;
    
    board[to.row][to.col] = movedPiece;
    
    // Update castling rights
    updateCastlingRights(newState, piece, from);
    
    // Update en passant square
    if (move.isDoublePawnPush) {
        newState.enPassantSquare = {
            row: (from.row + to.row) / 2,
            col: from.col
        };
    } else {
        newState.enPassantSquare = null;
    }
    
    // Update half-move clock (reset on pawn move or capture)
    if (piece.type === PIECES.PAWN || capture || enPassant) {
        newState.halfMoveClock = 0;
    } else {
        newState.halfMoveClock++;
    }
    
    // Update full-move number
    if (newState.turn === COLORS.BLACK) {
        newState.fullMoveNumber++;
    }
    
    // Switch turn
    newState.turn = newState.turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Update history (only if not in test mode)
    if (!testMode) {
        // Store position for threefold repetition detection
        newState.positionHistory.push(generateFEN({
            board: newState.board,
            turn: newState.turn,
            castlingRights: newState.castlingRights,
            enPassantSquare: newState.enPassantSquare,
            halfMoveClock: 0,
            fullMoveNumber: 0
        }));
    }
    
    return newState;
}

/**
 * Update castling rights after a move
 */
function updateCastlingRights(state, piece, from) {
    const { castlingRights } = state;
    
    // King moves - lose both castling rights
    if (piece.type === PIECES.KING) {
        castlingRights[piece.color].kingSide = false;
        castlingRights[piece.color].queenSide = false;
    }
    
    // Rook moves - lose corresponding castling right
    if (piece.type === PIECES.ROOK) {
        if (from.col === 0) {
            castlingRights[piece.color].queenSide = false;
        } else if (from.col === 7) {
            castlingRights[piece.color].kingSide = false;
        }
    }
}

/**
 * Check if a color's king is in check
 * 
 * @param {Object} state - Current game state
 * @param {string} color - Color to check
 * @returns {boolean} True if king is in check
 */
export function isInCheck(state, color) {
    const { board } = state;
    
    // Find king position
    let kingRow = -1;
    let kingCol = -1;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.type === PIECES.KING && piece.color === color) {
                kingRow = row;
                kingCol = col;
                break;
            }
        }
        if (kingRow !== -1) break;
    }
    
    if (kingRow === -1) {
        // King not found (shouldn't happen in valid game)
        return false;
    }
    
    return isSquareAttacked(state, kingRow, kingCol, color);
}

/**
 * Check if current position is checkmate
 * 
 * @param {Object} state - Current game state
 * @returns {boolean} True if checkmate
 */
export function isCheckmate(state) {
    if (!isInCheck(state, state.turn)) {
        return false;
    }
    
    const legalMoves = generateLegalMoves(state);
    return legalMoves.length === 0;
}

/**
 * Check if current position is stalemate
 * 
 * @param {Object} state - Current game state
 * @returns {boolean} True if stalemate
 */
export function isStalemate(state) {
    if (isInCheck(state, state.turn)) {
        return false;
    }
    
    const legalMoves = generateLegalMoves(state);
    return legalMoves.length === 0;
}

/**
 * Check for threefold repetition draw
 * 
 * @param {Object} state - Current game state
 * @returns {boolean} True if threefold repetition
 */
export function isThreefoldRepetition(state) {
    const { positionHistory } = state;
    const currentFEN = generateFEN({
        board: state.board,
        turn: state.turn,
        castlingRights: state.castlingRights,
        enPassantSquare: state.enPassantSquare,
        halfMoveClock: 0,
        fullMoveNumber: 0
    });
    
    let count = 0;
    for (const fen of positionHistory) {
        if (fen === currentFEN) {
            count++;
        }
    }
    
    return count >= 2; // Current position + 2 previous = 3 occurrences
}

/**
 * Check for 50-move rule draw
 * 
 * @param {Object} state - Current game state
 * @returns {boolean} True if 50-move rule applies
 */
export function isFiftyMoveRule(state) {
    return state.halfMoveClock >= 100; // 100 half-moves = 50 full moves
}

/**
 * Check if game is over and determine reason
 * 
 * @param {Object} state - Current game state
 * @returns {Object|null} Game over info or null if game continues
 */
export function getGameOverInfo(state) {
    // Checkmate
    if (isCheckmate(state)) {
        return {
            isGameOver: true,
            reason: 'checkmate',
            winner: state.turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE
        };
    }
    
    // Stalemate
    if (isStalemate(state)) {
        return {
            isGameOver: true,
            reason: 'stalemate'
        };
    }
    
    // Threefold repetition
    if (isThreefoldRepetition(state)) {
        return {
            isGameOver: true,
            reason: 'threefold-repetition'
        };
    }
    
    // 50-move rule
    if (isFiftyMoveRule(state)) {
        return {
            isGameOver: true,
            reason: 'fifty-move-rule'
        };
    }
    
    return null;
}

// =============================================================================
// Game State Management
// =============================================================================

/**
 * Execute a move and update game state
 * 
 * @param {Object} state - Current game state
 * @param {Object} move - Move to execute
 * @returns {Object} New game state with move recorded
 */
export function executeMove(state, move) {
    // Make the move
    const newState = makeMove(state, move, false);
    
    // Check for game over
    const gameOverInfo = getGameOverInfo(newState);
    if (gameOverInfo) {
        newState.isGameOver = true;
        newState.gameOverReason = gameOverInfo.reason;
        newState.winner = gameOverInfo.winner || null;
    }
    
    // Add SAN notation to move
    move.san = moveToSAN(move, state);
    
    // Add check/checkmate indicators
    if (gameOverInfo?.reason === 'checkmate') {
        move.isCheckmate = true;
    } else if (isInCheck(newState, newState.turn)) {
        move.isCheck = true;
    }
    
    // Record move in history
    newState.moveHistory.push(move);
    
    return newState;
}

/**
 * Undo the last move
 * 
 * @param {Object} state - Current game state
 * @returns {Object|null} Previous game state or null if no moves to undo
 */
export function undoMove(state) {
    const { moveHistory } = state;
    
    if (moveHistory.length === 0) {
        return null;
    }
    
    // Reconstruct state from scratch using all moves except the last one
    const initialState = createInitialState();
    const movesToReplay = moveHistory.slice(0, -1);
    
    let currentState = initialState;
    for (const move of movesToReplay) {
        currentState = executeMove(currentState, move);
    }
    
    return currentState;
}

/**
 * Get captured pieces for display
 * 
 * @param {Object} state - Current game state
 * @returns {Object} Captured pieces by color
 */
export function getCapturedPieces(state) {
    const captured = {
        [COLORS.WHITE]: [],
        [COLORS.BLACK]: []
    };
    
    // Count missing pieces from starting position
    const startingCounts = {
        [COLORS.WHITE]: { pawn: 8, knight: 2, bishop: 2, rook: 2, queen: 1, king: 1 },
        [COLORS.BLACK]: { pawn: 8, knight: 2, bishop: 2, rook: 2, queen: 1, king: 1 }
    };
    
    const currentCounts = {
        [COLORS.WHITE]: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 },
        [COLORS.BLACK]: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 }
    };
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = state.board[row][col];
            if (piece) {
                currentCounts[piece.color][piece.type]++;
            }
        }
    }
    
    // Calculate captured pieces (what each player has lost)
    for (const color of [COLORS.WHITE, COLORS.BLACK]) {
        for (const type of Object.keys(startingCounts[color])) {
            const missing = startingCounts[color][type] - currentCounts[color][type];
            for (let i = 0; i < missing; i++) {
                captured[color].push(type);
            }
        }
    }
    
    return captured;
}

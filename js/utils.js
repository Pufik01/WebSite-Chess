/**
 * Chess Utilities Module
 * 
 * Provides helper functions for:
 * - FEN string parsing and generation
 * - Algebraic notation conversion
 * - Move validation helpers
 * - General utility functions
 * 
 * @module utils
 */

// =============================================================================
// Constants
// =============================================================================

/**
 * Piece type constants - using single characters for FEN compatibility
 */
export const PIECES = {
    PAWN: 'p',
    KNIGHT: 'n',
    BISHOP: 'b',
    ROOK: 'r',
    QUEEN: 'q',
    KING: 'k'
};

/**
 * Color constants
 */
export const COLORS = {
    WHITE: 'w',
    BLACK: 'b'
};

/**
 * Unicode chess piece symbols for display
 */
export const PIECE_SYMBOLS = {
    [COLORS.WHITE]: {
        [PIECES.KING]: '♔',
        [PIECES.QUEEN]: '♕',
        [PIECES.ROOK]: '♖',
        [PIECES.BISHOP]: '♗',
        [PIECES.KNIGHT]: '♘',
        [PIECES.PAWN]: '♙'
    },
    [COLORS.BLACK]: {
        [PIECES.KING]: '♚',
        [PIECES.QUEEN]: '♛',
        [PIECES.ROOK]: '♜',
        [PIECES.BISHOP]: '♝',
        [PIECES.KNIGHT]: '♞',
        [PIECES.PAWN]: '♟'
    }
};

/**
 * File letters for algebraic notation
 */
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/**
 * Rank numbers for algebraic notation
 */
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// =============================================================================
// Coordinate Conversion
// =============================================================================

/**
 * Convert board coordinates (row, col) to algebraic notation (e.g., "e4")
 * 
 * @param {number} row - Row index (0-7, 0 is rank 8)
 * @param {number} col - Column index (0-7, 0 is file a)
 * @returns {string} Algebraic notation
 */
export function coordsToAlgebraic(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
        throw new Error(`Invalid coordinates: (${row}, ${col})`);
    }
    return `${FILES[col]}${RANKS[row]}`;
}

/**
 * Convert algebraic notation (e.g., "e4") to board coordinates
 * 
 * @param {string} algebraic - Algebraic notation
 * @returns {{row: number, col: number}} Board coordinates
 */
export function algebraicToCoords(algebraic) {
    if (!algebraic || algebraic.length !== 2) {
        throw new Error(`Invalid algebraic notation: ${algebraic}`);
    }
    
    const file = algebraic[0].toLowerCase();
    const rank = algebraic[1];
    
    const col = FILES.indexOf(file);
    const row = RANKS.indexOf(rank);
    
    if (col === -1 || row === -1) {
        throw new Error(`Invalid algebraic notation: ${algebraic}`);
    }
    
    return { row, col };
}

/**
 * Get square index from row and column (0-63)
 * 
 * @param {number} row - Row index (0-7)
 * @param {number} col - Column index (0-7)
 * @returns {number} Square index (0-63)
 */
export function getSquareIndex(row, col) {
    return row * 8 + col;
}

/**
 * Get row and column from square index
 * 
 * @param {number} index - Square index (0-63)
 * @returns {{row: number, col: number}} Board coordinates
 */
export function getSquareCoords(index) {
    return {
        row: Math.floor(index / 8),
        col: index % 8
    };
}

// =============================================================================
// FEN (Forsyth-Edwards Notation)
// =============================================================================

/**
 * Parse a FEN string into game state components
 * 
 * FEN format: position active-color castling en-passant halfmove fullmove
 * 
 * @param {string} fen - FEN string
 * @returns {Object} Parsed FEN data
 * @throws {Error} If FEN is invalid
 */
export function parseFEN(fen) {
    if (!fen || typeof fen !== 'string') {
        throw new Error('Invalid FEN: must be a non-empty string');
    }
    
    const parts = fen.trim().split(/\s+/);
    
    if (parts.length < 4) {
        throw new Error('Invalid FEN: must have at least 4 parts');
    }
    
    const [position, activeColor, castling, enPassant, halfMove = '0', fullMove = '1'] = parts;
    
    // Validate position (must have 8 ranks)
    const ranks = position.split('/');
    if (ranks.length !== 8) {
        throw new Error('Invalid FEN: position must have 8 ranks');
    }
    
    // Parse board positions
    const board = [];
    for (const rank of ranks) {
        const row = [];
        for (const char of rank) {
            if (/\d/.test(char)) {
                // Number represents empty squares
                for (let i = 0; i < parseInt(char, 10); i++) {
                    row.push(null);
                }
            } else if (/[pnbrqk]/i.test(char)) {
                // Piece character
                const color = char === char.toUpperCase() ? COLORS.WHITE : COLORS.BLACK;
                const type = char.toLowerCase();
                row.push({ type, color });
            } else {
                throw new Error(`Invalid FEN: unexpected character '${char}'`);
            }
        }
        if (row.length !== 8) {
            throw new Error('Invalid FEN: each rank must have 8 squares');
        }
        board.push(row);
    }
    
    // Validate active color
    const turn = activeColor === 'w' ? COLORS.WHITE : COLORS.BLACK;
    
    // Parse castling rights
    const castlingRights = {
        [COLORS.WHITE]: { kingSide: false, queenSide: false },
        [COLORS.BLACK]: { kingSide: false, queenSide: false }
    };
    
    if (castling !== '-') {
        for (const char of castling) {
            switch (char) {
                case 'K': castlingRights[COLORS.WHITE].kingSide = true; break;
                case 'Q': castlingRights[COLORS.WHITE].queenSide = true; break;
                case 'k': castlingRights[COLORS.BLACK].kingSide = true; break;
                case 'q': castlingRights[COLORS.BLACK].queenSide = true; break;
                default: throw new Error(`Invalid FEN: unexpected castling character '${char}'`);
            }
        }
    }
    
    // Parse en passant square
    let enPassantSquare = null;
    if (enPassant !== '-') {
        try {
            enPassantSquare = algebraicToCoords(enPassant);
        } catch {
            throw new Error(`Invalid FEN: invalid en passant square '${enPassant}'`);
        }
    }
    
    return {
        board,
        turn,
        castlingRights,
        enPassantSquare,
        halfMoveClock: parseInt(halfMove, 10) || 0,
        fullMoveNumber: parseInt(fullMove, 10) || 1
    };
}

/**
 * Generate a FEN string from game state
 * 
 * @param {Object} gameState - Current game state
 * @returns {string} FEN string
 */
export function generateFEN(gameState) {
    const { board, turn, castlingRights, enPassantSquare, halfMoveClock, fullMoveNumber } = gameState;
    
    // Build position part
    const positionParts = [];
    for (let row = 0; row < 8; row++) {
        let rankStr = '';
        let emptyCount = 0;
        
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece === null) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    rankStr += emptyCount;
                    emptyCount = 0;
                }
                const pieceChar = piece.color === COLORS.WHITE 
                    ? piece.type.toUpperCase() 
                    : piece.type;
                rankStr += pieceChar;
            }
        }
        
        if (emptyCount > 0) {
            rankStr += emptyCount;
        }
        positionParts.push(rankStr);
    }
    const position = positionParts.join('/');
    
    // Build castling part
    let castlingStr = '';
    if (castlingRights[COLORS.WHITE].kingSide) castlingStr += 'K';
    if (castlingRights[COLORS.WHITE].queenSide) castlingStr += 'Q';
    if (castlingRights[COLORS.BLACK].kingSide) castlingStr += 'k';
    if (castlingRights[COLORS.BLACK].queenSide) castlingStr += 'q';
    if (castlingStr === '') castlingStr = '-';
    
    // Build en passant part
    const enPassantStr = enPassantSquare 
        ? coordsToAlgebraic(enPassantSquare.row, enPassantSquare.col)
        : '-';
    
    return `${position} ${turn} ${castlingStr} ${enPassantStr} ${halfMoveClock || 0} ${fullMoveNumber || 1}`;
}

// =============================================================================
// Algebraic Notation
// =============================================================================

/**
 * Convert a move object to Standard Algebraic Notation (SAN)
 * 
 * @param {Object} move - Move object
 * @param {Object} gameState - Current game state before the move
 * @returns {string} SAN move notation
 */
export function moveToSAN(move, gameState) {
    const { piece, from, to, capture, castling, promotion, isCheck, isCheckmate } = move;
    
    // Handle castling
    if (castling) {
        if (castling === 'kingSide') return 'O-O';
        if (castling === 'queenSide') return 'O-O-O';
    }
    
    let san = '';
    
    // Piece letter (not for pawns)
    if (piece.type !== PIECES.PAWN) {
        san += piece.type.toUpperCase();
    }
    
    // Disambiguation (if needed - simplified, assumes unique piece can make move)
    // Full implementation would check if other pieces of same type can move to same square
    
    // Capture
    if (capture || move.enPassant) {
        if (piece.type === PIECES.PAWN) {
            san += FILES[from.col];
        }
        san += 'x';
    }
    
    // Destination square
    san += coordsToAlgebraic(to.row, to.col);
    
    // Promotion
    if (promotion) {
        san += '=' + promotion.toUpperCase();
    }
    
    // Check/Checkmate suffix
    if (isCheckmate) {
        san += '#';
    } else if (isCheck) {
        san += '+';
    }
    
    return san;
}

/**
 * Parse a SAN move back to move components (simplified)
 * 
 * @param {string} san - SAN notation
 * @returns {Object|null} Parsed move components or null if invalid
 */
export function parseSAN(san) {
    // This is a simplified parser - full implementation would be more complex
    const result = {
        castling: null,
        promotion: null,
        isCapture: false
    };
    
    // Castling
    if (san === 'O-O' || san === '0-0') {
        result.castling = 'kingSide';
        return result;
    }
    if (san === 'O-O-O' || san === '0-0-0') {
        result.castling = 'queenSide';
        return result;
    }
    
    // Promotion
    const promoMatch = san.match(/=([QRBN])/);
    if (promoMatch) {
        result.promotion = promoMatch[1].toLowerCase();
    }
    
    // Capture
    if (san.includes('x')) {
        result.isCapture = true;
    }
    
    return result;
}

// =============================================================================
// PGN (Portable Game Notation)
// =============================================================================

/**
 * Generate PGN string from move history
 * 
 * @param {Array} moves - Array of move objects with SAN notation
 * @param {Object} metadata - Game metadata (players, date, etc.)
 * @returns {string} PGN formatted string
 */
export function generatePGN(moves, metadata = {}) {
    const lines = [];
    
    // PGN metadata tags
    const defaultMetadata = {
        Event: 'Chess Game',
        Site: 'Web Browser',
        Date: new Date().toISOString().split('T')[0],
        Round: '?',
        White: metadata.white || 'White',
        Black: metadata.black || 'Black',
        Result: metadata.result || '*'
    };
    
    for (const [key, value] of Object.entries(defaultMetadata)) {
        lines.push(`[${key} "${value}"]`);
    }
    
    // Empty line between tags and moves
    lines.push('');
    
    // Format moves
    const movePairs = [];
    for (let i = 0; i < moves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = moves[i]?.san || '';
        const blackMove = moves[i + 1]?.san || '';
        movePairs.push(`${moveNum}. ${whiteMove}${blackMove ? ' ' + blackMove : ''}`);
    }
    
    // Wrap moves to reasonable line length
    let currentLine = '';
    for (const pair of movePairs) {
        if (currentLine.length + pair.length > 80) {
            lines.push(currentLine);
            currentLine = pair;
        } else {
            currentLine += (currentLine ? ' ' : '') + pair;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines.join('\n');
}

// =============================================================================
// Game State Utilities
// =============================================================================

/**
 * Deep clone a game state object (immutable update helper)
 * 
 * @param {Object} state - State to clone
 * @returns {Object} Cloned state
 */
export function cloneGameState(state) {
    return JSON.parse(JSON.stringify(state));
}

/**
 * Check if two positions are equal (for threefold repetition)
 * 
 * @param {Object} state1 - First game state
 * @param {Object} state2 - Second game state
 * @returns {boolean} True if positions are identical
 */
export function positionsAreEqual(state1, state2) {
    // Compare board position, turn, castling rights, and en passant
    const fen1 = generateFEN({
        board: state1.board,
        turn: state1.turn,
        castlingRights: state1.castlingRights,
        enPassantSquare: state1.enPassantSquare,
        halfMoveClock: 0,
        fullMoveNumber: 0
    });
    const fen2 = generateFEN({
        board: state2.board,
        turn: state2.turn,
        castlingRights: state2.castlingRights,
        enPassantSquare: state2.enPassantSquare,
        halfMoveClock: 0,
        fullMoveNumber: 0
    });
    
    // Compare only the first 4 FEN fields (ignore half/full move counters)
    const parts1 = fen1.split(' ').slice(0, 4);
    const parts2 = fen2.split(' ').slice(0, 4);
    
    return parts1.join(' ') === parts2.join(' ');
}

/**
 * Count material on the board
 * 
 * @param {Array} board - 8x8 board array
 * @returns {Object} Material counts for both colors
 */
export function countMaterial(board) {
    const material = {
        [COLORS.WHITE]: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0 },
        [COLORS.BLACK]: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0 }
    };
    
    const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.type !== PIECES.KING) {
                material[piece.color][piece.type]++;
            }
        }
    }
    
    return material;
}

/**
 * Check if there's insufficient material for checkmate
 * 
 * @param {Array} board - 8x8 board array
 * @returns {boolean} True if draw by insufficient material
 */
export function hasInsufficientMaterial(board) {
    const material = countMaterial(board);
    
    // King vs King
    if (
        material[COLORS.WHITE].pawn === 0 &&
        material[COLORS.WHITE].knight === 0 &&
        material[COLORS.WHITE].bishop === 0 &&
        material[COLORS.WHITE].rook === 0 &&
        material[COLORS.WHITE].queen === 0 &&
        material[COLORS.BLACK].pawn === 0 &&
        material[COLORS.BLACK].knight === 0 &&
        material[COLORS.BLACK].bishop === 0 &&
        material[COLORS.BLACK].rook === 0 &&
        material[COLORS.BLACK].queen === 0
    ) {
        return true;
    }
    
    // King + Bishop vs King or King + Knight vs King
    const whiteMinor = material[COLORS.WHITE].knight + material[COLORS.WHITE].bishop;
    const blackMinor = material[COLORS.BLACK].knight + material[COLORS.BLACK].bishop;
    
    if (
        (material[COLORS.WHITE].pawn === 0 && material[COLORS.WHITE].rook === 0 && 
         material[COLORS.WHITE].queen === 0 && whiteMinor <= 1) &&
        (material[COLORS.BLACK].pawn === 0 && material[COLORS.BLACK].rook === 0 && 
         material[COLORS.BLACK].queen === 0 && blackMinor === 0)
    ) {
        return true;
    }
    
    if (
        (material[COLORS.BLACK].pawn === 0 && material[COLORS.BLACK].rook === 0 && 
         material[COLORS.BLACK].queen === 0 && blackMinor <= 1) &&
        (material[COLORS.WHITE].pawn === 0 && material[COLORS.WHITE].rook === 0 && 
         material[COLORS.WHITE].queen === 0 && whiteMinor === 0)
    ) {
        return true;
    }
    
    return false;
}

// =============================================================================
// Audio Helper (Web Audio API placeholder)
// =============================================================================

/**
 * Create audio context and sound generators
 * Returns noop functions if audio is not supported or user hasn't interacted
 * 
 * @returns {Object} Audio functions
 */
export function createAudioContext() {
    let audioCtx = null;
    
    /**
     * Initialize audio context (must be called after user interaction)
     */
    function init() {
        if (!audioCtx && typeof AudioContext !== 'undefined') {
            audioCtx = new AudioContext();
        }
    }
    
    /**
     * Play a simple beep tone
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} type - Wave type ('sine', 'square', 'triangle')
     */
    function playTone(frequency, duration, type = 'sine') {
        if (!audioCtx) return;
        
        try {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Audio playback failed silently
        }
    }
    
    return {
        init,
        playMove: () => playTone(300, 0.1, 'sine'),
        playCapture: () => playTone(200, 0.15, 'triangle'),
        playCheck: () => {
            playTone(400, 0.1, 'sine');
            setTimeout(() => playTone(300, 0.1, 'sine'), 120);
        },
        playGameOver: () => {
            playTone(400, 0.2, 'sine');
            setTimeout(() => playTone(500, 0.2, 'sine'), 250);
            setTimeout(() => playTone(600, 0.4, 'sine'), 500);
        }
    };
}

// =============================================================================
// Debounce/Throttle Utilities
// =============================================================================

/**
 * Debounce a function
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

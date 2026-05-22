/**
 * Chess Game Main Module
 * 
 * Bootstrap and UI wiring for the chess application.
 * Handles:
 * - Application initialization
 * - State management
 * - Event handling and user interactions
 * - Theme management
 * - Toast notifications
 * 
 * @module main
 */

import {
    createInitialState,
    executeMove,
    undoMove,
    generateLegalMoves,
    isInCheck,
    getCapturedPieces
} from './game.js';

import { parseFEN, generateFEN, generatePGN, COLORS, createAudioContext } from './utils.js';

import {
    renderBoard,
    setupBoardInteractions,
    setupKeyboardNavigation,
    showPromotionModal,
    updateCapturedPieces,
    updateMoveHistory,
    updateGameStatus,
    setBoardFlipped
} from './board.js';

// =============================================================================
// Application State
// =============================================================================

/**
 * Main application state
 */
const appState = {
    gameState: null,
    uiState: {
        selectedSquare: null,
        legalMoves: [],
        lastMove: null,
        kingInCheck: null
    },
    isFlipped: false,
    pendingMove: null // For promotion handling
};

// Audio context (initialized on first user interaction)
let audio = null;

// =============================================================================
// DOM Elements Cache
// =============================================================================

let elements = {};

/**
 * Cache DOM element references
 */
function cacheElements() {
    elements = {
        board: document.getElementById('chessBoard'),
        boardContainer: document.querySelector('.board-container'),
        gameStatus: document.getElementById('gameStatus'),
        moveHistory: document.getElementById('moveHistory'),
        capturedByWhite: document.getElementById('capturedByWhite'),
        capturedByBlack: document.getElementById('capturedByBlack'),
        topPlayerName: document.getElementById('topPlayerName'),
        bottomPlayerName: document.getElementById('bottomPlayerName'),
        topPlayerStatus: document.getElementById('topPlayerStatus'),
        bottomPlayerStatus: document.getElementById('bottomPlayerStatus'),
        newGameBtn: document.getElementById('newGameBtn'),
        undoBtn: document.getElementById('undoBtn'),
        flipBoardBtn: document.getElementById('flipBoardBtn'),
        themeToggle: document.getElementById('themeToggle'),
        exportFenBtn: document.getElementById('exportFenBtn'),
        importFenBtn: document.getElementById('importFenBtn'),
        fenInput: document.getElementById('fenInput'),
        exportPgnBtn: document.getElementById('exportPgnBtn'),
        pgnOutput: document.getElementById('pgnOutput'),
        promotionModal: document.getElementById('promotionModal'),
        promotionOptions: document.getElementById('promotionOptions'),
        gameOverModal: document.getElementById('gameOverModal'),
        gameOverMessage: document.getElementById('gameOverMessage'),
        newGameFromModal: document.getElementById('newGameFromModal'),
        closeGameOverModal: document.getElementById('closeGameOverModal'),
        toastContainer: document.getElementById('toastContainer')
    };
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize the chess application
 */
function init() {
    cacheElements();
    
    // Initialize audio on first user interaction
    initAudio();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up keyboard navigation
    setupKeyboardNavigation(
        elements.board,
        handleKeyboardNavigate,
        handleKeyboardSelect
    );
    
    // Set up board interactions
    setupBoardInteractions(
        elements.board,
        handleSquareClick,
        handlePieceDrag
    );
    
    // Load saved theme
    loadTheme();
    
    // Start new game
    startNewGame();
}

/**
 * Initialize audio context
 */
function initAudio() {
    audio = createAudioContext();
    
    // Initialize on first click anywhere
    document.addEventListener('click', () => audio.init(), { once: true });
}

/**
 * Start a new game
 */
function startNewGame() {
    appState.gameState = createInitialState();
    appState.uiState = {
        selectedSquare: null,
        legalMoves: [],
        lastMove: null,
        kingInCheck: null
    };
    appState.pendingMove = null;
    
    // Clear inputs
    elements.fenInput.value = '';
    elements.pgnOutput.value = '';
    
    render();
    showToast('New game started!', 'success');
}

// =============================================================================
// Rendering
// =============================================================================

/**
 * Render the complete UI
 */
function render() {
    const { gameState, uiState, isFlipped } = appState;
    
    // Render board
    renderBoard(elements.board, gameState, uiState, isFlipped);
    
    // Update status
    updateGameStatus(elements.gameStatus, gameState);
    
    // Update move history
    updateMoveHistory(elements.moveHistory, gameState.moveHistory);
    
    // Update captured pieces
    const captured = getCapturedPieces(gameState);
    updateCapturedPieces(elements.capturedByWhite, captured[COLORS.WHITE]);
    updateCapturedPieces(elements.capturedByBlack, captured[COLORS.BLACK]);
    
    // Update player info based on board orientation
    if (isFlipped) {
        elements.topPlayerName.textContent = 'White';
        elements.bottomPlayerName.textContent = 'Black';
    } else {
        elements.topPlayerName.textContent = 'Black';
        elements.bottomPlayerName.textContent = 'White';
    }
    
    // Update check indicators
    const whiteInCheck = isInCheck(gameState, COLORS.WHITE);
    const blackInCheck = isInCheck(gameState, COLORS.BLACK);
    
    elements.topPlayerStatus.textContent = isFlipped ? (whiteInCheck ? 'In Check' : '') : (blackInCheck ? 'In Check' : '');
    elements.bottomPlayerStatus.textContent = isFlipped ? (blackInCheck ? 'In Check' : '') : (whiteInCheck ? 'In Check' : '');
    
    elements.topPlayerStatus.className = `player-status ${isFlipped ? (whiteInCheck ? 'in-check' : '') : (blackInCheck ? 'in-check' : '')}`;
    elements.bottomPlayerStatus.className = `player-status ${isFlipped ? (blackInCheck ? 'in-check' : '') : (whiteInCheck ? 'in-check' : '')}`;
    
    // Update undo button state
    elements.undoBtn.disabled = gameState.moveHistory.length === 0;
    
    // Show game over modal if needed
    if (gameState.isGameOver) {
        showGameOverModal();
    }
}

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handle square click
 * 
 * @param {Object} coords - Square coordinates
 */
function handleSquareClick(coords) {
    const { gameState, uiState } = appState;
    const { row, col } = coords;
    
    // If game is over, ignore clicks
    if (gameState.isGameOver) return;
    
    const clickedPiece = gameState.board[row][col];
    const isOwnPiece = clickedPiece && clickedPiece.color === gameState.turn;
    
    // If we have a selected square
    if (uiState.selectedSquare) {
        // Check if clicking on a legal move destination
        const legalMove = uiState.legalMoves.find(
            m => m.to.row === row && m.to.col === col
        );
        
        if (legalMove) {
            // Execute the move
            attemptMove(legalMove);
            return;
        }
        
        // If clicking on another own piece, select it instead
        if (isOwnPiece) {
            selectSquare(coords);
            return;
        }
        
        // Otherwise, deselect
        deselectSquare();
        return;
    }
    
    // No selection yet - select if it's own piece
    if (isOwnPiece) {
        selectSquare(coords);
    }
}

/**
 * Handle piece drag (touch)
 * 
 * @param {Object} from - Source coordinates
 * @param {Object} to - Destination coordinates
 */
function handlePieceDrag(from, to) {
    const { gameState } = appState;
    
    if (gameState.isGameOver) return;
    
    // Find if this is a legal move
    const legalMoves = generateLegalMoves(gameState);
    const legalMove = legalMoves.find(
        m => m.from.row === from.row && m.from.col === from.col &&
             m.to.row === to.row && m.to.col === to.col
    );
    
    if (legalMove) {
        attemptMove(legalMove);
    }
}

/**
 * Handle keyboard navigation
 * 
 * @param {Object|null} coords - Target coordinates or null to clear
 */
function handleKeyboardNavigate(coords) {
    if (!coords) {
        appState.uiState.selectedSquare = null;
        appState.uiState.legalMoves = [];
        render();
        return;
    }
    
    // Just update focus visually (handled by browser)
    // Selection happens on Enter/Space
}

/**
 * Handle keyboard selection (Enter/Space)
 * 
 * @param {Object} coords - Selected coordinates
 */
function handleKeyboardSelect(coords) {
    handleSquareClick(coords);
}

/**
 * Select a square
 * 
 * @param {Object} coords - Square coordinates
 */
function selectSquare(coords) {
    const { gameState } = appState;
    
    appState.uiState.selectedSquare = coords;
    appState.uiState.legalMoves = generateLegalMoves(gameState).filter(
        m => m.from.row === coords.row && m.from.col === coords.col
    );
    
    render();
}

/**
 * Deselect current square
 */
function deselectSquare() {
    appState.uiState.selectedSquare = null;
    appState.uiState.legalMoves = [];
    render();
}

/**
 * Attempt to make a move (handles promotion)
 * 
 * @param {Object} move - Move to execute
 */
async function attemptMove(move) {
    const { gameState } = appState;
    const { piece, promotion } = move;
    
    // Check if pawn promotion is needed
    const needsPromotion = piece.type === 'p' && !promotion &&
        ((piece.color === COLORS.WHITE && move.to.row === 0) ||
         (piece.color === COLORS.BLACK && move.to.row === 7));
    
    if (needsPromotion) {
        // Show promotion modal
        try {
            const promoType = await showPromotionModal(
                elements.promotionModal,
                elements.promotionOptions,
                piece.color
            );
            move.promotion = promoType;
        } catch (e) {
            // Modal closed without selection
            return;
        }
    }
    
    // Execute the move
    appState.gameState = executeMove(gameState, move);
    appState.uiState.lastMove = move;
    appState.uiState.kingInCheck = isInCheck(appState.gameState, appState.gameState.turn)
        ? findKing(appState.gameState.board, appState.gameState.turn)
        : null;
    
    // Play sound
    if (audio) {
        if (move.capture || move.enPassant) {
            audio.playCapture();
        } else if (appState.uiState.kingInCheck) {
            audio.playCheck();
        } else {
            audio.playMove();
        }
    }
    
    deselectSquare();
    render();
}

/**
 * Find king position
 * 
 * @param {Array} board - Board array
 * @param {string} color - King color
 * @returns {Object|null} King coordinates
 */
function findKing(board, color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.type === 'k' && piece.color === color) {
                return { row, col };
            }
        }
    }
    return null;
}

// =============================================================================
// Control Button Handlers
// =============================================================================

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // New Game
    elements.newGameBtn.addEventListener('click', startNewGame);
    elements.newGameFromModal.addEventListener('click', () => {
        elements.gameOverModal.close();
        startNewGame();
    });
    
    // Undo
    elements.undoBtn.addEventListener('click', handleUndo);
    
    // Flip Board
    elements.flipBoardBtn.addEventListener('click', handleFlipBoard);
    
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // FEN Export
    elements.exportFenBtn.addEventListener('click', handleExportFEN);
    
    // FEN Import
    elements.importFenBtn.addEventListener('click', handleImportFEN);
    
    // PGN Export
    elements.exportPgnBtn.addEventListener('click', handleExportPGN);
    
    // Close Game Over Modal
    elements.closeGameOverModal.addEventListener('click', () => {
        elements.gameOverModal.close();
    });
    
    // Close modals on backdrop click
    elements.promotionModal.addEventListener('click', (e) => {
        if (e.target === elements.promotionModal) {
            elements.promotionModal.close();
        }
    });
    
    elements.gameOverModal.addEventListener('click', (e) => {
        if (e.target === elements.gameOverModal) {
            elements.gameOverModal.close();
        }
    });
}

/**
 * Handle undo move
 */
function handleUndo() {
    const previousState = undoMove(appState.gameState);
    
    if (previousState) {
        appState.gameState = previousState;
        appState.uiState.selectedSquare = null;
        appState.uiState.legalMoves = [];
        
        // Update last move highlight
        const lastMove = appState.gameState.moveHistory[appState.gameState.moveHistory.length - 1];
        appState.uiState.lastMove = lastMove || null;
        appState.uiState.kingInCheck = isInCheck(appState.gameState, appState.gameState.turn)
            ? findKing(appState.gameState.board, appState.gameState.turn)
            : null;
        
        render();
        showToast('Move undone', 'info');
    } else {
        showToast('No moves to undo', 'warning');
    }
}

/**
 * Handle flip board
 */
function handleFlipBoard() {
    appState.isFlipped = !appState.isFlipped;
    setBoardFlipped(elements.boardContainer, appState.isFlipped);
    render();
}

/**
 * Handle FEN export
 */
function handleExportFEN() {
    const fen = generateFEN(appState.gameState);
    elements.fenInput.value = fen;
    
    // Copy to clipboard
    navigator.clipboard.writeText(fen).then(() => {
        showToast('FEN copied to clipboard!', 'success');
    }).catch(() => {
        showToast('FEN generated (select to copy)', 'info');
    });
}

/**
 * Handle FEN import
 */
function handleImportFEN() {
    const fen = elements.fenInput.value.trim();
    
    if (!fen) {
        showToast('Please enter a FEN string', 'warning');
        return;
    }
    
    try {
        const parsed = parseFEN(fen);
        
        // Create new state from FEN
        appState.gameState = {
            board: parsed.board,
            turn: parsed.turn,
            castlingRights: parsed.castlingRights,
            enPassantSquare: parsed.enPassantSquare,
            halfMoveClock: parsed.halfMoveClock,
            fullMoveNumber: parsed.fullMoveNumber,
            moveHistory: [],
            positionHistory: [],
            isGameOver: false,
            gameOverReason: null
        };
        
        appState.uiState = {
            selectedSquare: null,
            legalMoves: [],
            lastMove: null,
            kingInCheck: isInCheck(appState.gameState, appState.gameState.turn)
                ? findKing(appState.gameState.board, appState.gameState.turn)
                : null
        };
        
        render();
        showToast('FEN loaded successfully!', 'success');
    } catch (e) {
        showToast(`Invalid FEN: ${e.message}`, 'error');
    }
}

/**
 * Handle PGN export
 */
function handleExportPGN() {
    const pgn = generatePGN(appState.gameState.moveHistory);
    elements.pgnOutput.value = pgn;
    
    // Copy to clipboard
    navigator.clipboard.writeText(pgn).then(() => {
        showToast('PGN copied to clipboard!', 'success');
    }).catch(() => {
        showToast('PGN generated (select to copy)', 'info');
    });
}

// =============================================================================
// Theme Management
// =============================================================================

/**
 * Load saved theme preference
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('chess-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    applyTheme(newTheme);
    localStorage.setItem('chess-theme', newTheme);
    
    // Update icon
    const icon = elements.themeToggle.querySelector('.theme-icon');
    icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

/**
 * Apply theme to document
 * 
 * @param {string} theme - Theme name
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update icon
    const icon = elements.themeToggle.querySelector('.theme-icon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// =============================================================================
// Modal & Notifications
// =============================================================================

/**
 * Show game over modal
 */
function showGameOverModal() {
    const { gameState } = appState;
    
    let message = '';
    switch (gameState.gameOverReason) {
        case 'checkmate':
            const winner = gameState.winner === COLORS.WHITE ? 'White' : 'Black';
            message = `Checkmate! ${winner} wins!`;
            break;
        case 'stalemate':
            message = 'Stalemate - The game is a draw.';
            break;
        case 'threefold-repetition':
            message = 'Draw by Threefold Repetition.';
            break;
        case 'fifty-move-rule':
            message = 'Draw by the 50-Move Rule.';
            break;
        default:
            message = 'Game Over';
    }
    
    elements.gameOverMessage.textContent = message;
    elements.gameOverModal.showModal();
    
    if (audio) {
        audio.playGameOver();
    }
}

/**
 * Show toast notification
 * 
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto-remove after delay
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =============================================================================
// Start Application
// =============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

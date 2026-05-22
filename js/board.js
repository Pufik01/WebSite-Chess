/**
 * Chess Board Rendering Module
 * 
 * Handles:
 * - DOM rendering of board and pieces
 * - Click and drag interactions
 * - Keyboard navigation
 * - Visual highlights and animations
 * - Promotion modal handling
 * 
 * @module board
 */

import { PIECES, COLORS, PIECE_SYMBOLS, coordsToAlgebraic } from './utils.js';
import { generateLegalMoves, isInCheck, canCastle } from './game.js';

// =============================================================================
// Constants
// =============================================================================

const ANIMATION_DURATION = 300; // ms

// =============================================================================
// Board Rendering
// =============================================================================

/**
 * Render the complete chess board
 * 
 * @param {HTMLElement} boardElement - Board container element
 * @param {Object} state - Current game state
 * @param {Object} uiState - UI state (selected square, legal moves, etc.)
 * @param {boolean} isFlipped - Whether board is flipped for black view
 */
export function renderBoard(boardElement, state, uiState, isFlipped = false) {
    const { board, turn } = state;
    const { selectedSquare, legalMoves, lastMove, kingInCheck } = uiState;
    
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = 'repeat(8, 1fr)';
    boardElement.style.gridTemplateRows = 'repeat(8, 1fr)';
    
    // Create squares
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            const isLight = (row + col) % 2 === 0;
            
            square.className = `square ${isLight ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            square.setAttribute('role', 'gridcell');
            square.setAttribute('aria-label', getSquareAriaLabel(row, col, board[row][col]));
            
            // Apply highlights
            if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                square.classList.add('selected');
            }
            
            if (lastMove) {
                if ((lastMove.from.row === row && lastMove.from.col === col) ||
                    (lastMove.to.row === row && lastMove.to.col === col)) {
                    square.classList.add('last-move');
                }
            }
            
            if (kingInCheck && kingInCheck.row === row && kingInCheck.col === col) {
                square.classList.add('in-check');
            }
            
            // Add legal move indicator
            const legalMove = legalMoves?.find(m => m.to.row === row && m.to.col === col);
            if (legalMove) {
                const indicator = document.createElement('div');
                indicator.className = 'legal-move-indicator';
                if (legalMove.capture || legalMove.enPassant) {
                    square.classList.add('legal-move-capture');
                }
                square.appendChild(indicator);
            }
            
            // Add piece
            const piece = board[row][col];
            if (piece) {
                const pieceElement = createPieceElement(piece);
                pieceElement.dataset.fromRow = row;
                pieceElement.dataset.fromCol = col;
                square.appendChild(pieceElement);
            }
            
            boardElement.appendChild(square);
        }
    }
}

/**
 * Create a piece DOM element
 * 
 * @param {Object} piece - Piece object
 * @returns {HTMLElement} Piece element
 */
export function createPieceElement(piece) {
    const pieceEl = document.createElement('span');
    pieceEl.className = `piece ${piece.color === COLORS.WHITE ? 'white' : 'black'}`;
    pieceEl.textContent = PIECE_SYMBOLS[piece.color][piece.type];
    pieceEl.setAttribute('aria-hidden', 'true');
    return pieceEl;
}

/**
 * Get ARIA label for a square
 * 
 * @param {number} row - Square row
 * @param {number} col - Square column
 * @param {Object|null} piece - Piece on square
 * @returns {string} ARIA label
 */
function getSquareAriaLabel(row, col, piece) {
    const coords = coordsToAlgebraic(row, col);
    if (piece) {
        const pieceName = getPieceName(piece.type);
        const color = piece.color === COLORS.WHITE ? 'White' : 'Black';
        return `${coords} - ${color} ${pieceName}`;
    }
    return `${coords} - empty`;
}

/**
 * Get human-readable piece name
 * 
 * @param {string} type - Piece type
 * @returns {string} Piece name
 */
function getPieceName(type) {
    const names = {
        [PIECES.KING]: 'King',
        [PIECES.QUEEN]: 'Queen',
        [PIECES.ROOK]: 'Rook',
        [PIECES.BISHOP]: 'Bishop',
        [PIECES.KNIGHT]: 'Knight',
        [PIECES.PAWN]: 'Pawn'
    };
    return names[type] || type;
}

// =============================================================================
// Interaction Handling
// =============================================================================

/**
 * Set up click interaction handlers
 * 
 * @param {HTMLElement} boardElement - Board container
 * @param {Function} onSquareClick - Click handler callback
 * @param {Function} onPieceDrag - Drag handler callback
 */
export function setupBoardInteractions(boardElement, onSquareClick, onPieceDrag) {
    // Use event delegation for better performance
    boardElement.addEventListener('click', handleBoardClick);
    
    // Touch support
    let touchStartX = 0;
    let touchStartY = 0;
    let draggedPiece = null;
    
    boardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    boardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    boardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    function handleBoardClick(event) {
        const square = event.target.closest('.square');
        if (!square) return;
        
        const row = parseInt(square.dataset.row, 10);
        const col = parseInt(square.dataset.col, 10);
        
        onSquareClick({ row, col });
    }
    
    function handleTouchStart(event) {
        const touch = event.touches[0];
        const square = touch.target.closest('.square');
        if (!square) return;
        
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        
        const piece = square.querySelector('.piece');
        if (piece) {
            draggedPiece = piece;
        }
    }
    
    function handleTouchMove(event) {
        if (!draggedPiece) return;
        event.preventDefault();
        
        const touch = event.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        draggedPiece.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.15)`;
        draggedPiece.style.zIndex = '100';
    }
    
    function handleTouchEnd(event) {
        if (!draggedPiece) return;
        
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Reset piece position
        draggedPiece.style.transform = '';
        draggedPiece.style.zIndex = '';
        
        // Calculate which square we dropped on
        const startSquare = draggedPiece.parentElement;
        const startRow = parseInt(startSquare.dataset.row, 10);
        const startCol = parseInt(startSquare.dataset.col, 10);
        
        // Estimate drop target based on drag distance
        const squareSize = startSquare.offsetWidth;
        const endCol = Math.round(startCol + deltaX / squareSize);
        const endRow = Math.round(startRow + deltaY / squareSize);
        
        if (endRow >= 0 && endRow < 8 && endCol >= 0 && endCol < 8) {
            onPieceDrag(
                { row: startRow, col: startCol },
                { row: endRow, col: endCol }
            );
        }
        
        draggedPiece = null;
    }
    
    // Cleanup function
    return () => {
        boardElement.removeEventListener('click', handleBoardClick);
        boardElement.removeEventListener('touchstart', handleTouchStart);
        boardElement.removeEventListener('touchmove', handleTouchMove);
        boardElement.removeEventListener('touchend', handleTouchEnd);
    };
}

/**
 * Handle keyboard navigation on the board
 * 
 * @param {HTMLElement} boardElement - Board container
 * @param {Function} onNavigate - Navigation callback
 * @param {Function} onSelect - Selection callback
 */
export function setupKeyboardNavigation(boardElement, onNavigate, onSelect) {
    let focusedRow = 7; // Start from white's perspective
    let focusedCol = 4; // e-file
    
    boardElement.addEventListener('keydown', (event) => {
        const { key } = event;
        
        switch (key) {
            case 'ArrowUp':
                event.preventDefault();
                focusedRow = Math.max(0, focusedRow - 1);
                focusSquare(focusedRow, focusedCol);
                onNavigate({ row: focusedRow, col: focusedCol });
                break;
                
            case 'ArrowDown':
                event.preventDefault();
                focusedRow = Math.min(7, focusedRow + 1);
                focusSquare(focusedRow, focusedCol);
                onNavigate({ row: focusedRow, col: focusedCol });
                break;
                
            case 'ArrowLeft':
                event.preventDefault();
                focusedCol = Math.max(0, focusedCol - 1);
                focusSquare(focusedRow, focusedCol);
                onNavigate({ row: focusedRow, col: focusedCol });
                break;
                
            case 'ArrowRight':
                event.preventDefault();
                focusedCol = Math.min(7, focusedCol + 1);
                focusSquare(focusedRow, focusedCol);
                onNavigate({ row: focusedRow, col: focusedCol });
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                onSelect({ row: focusedRow, col: focusedCol });
                break;
                
            case 'Escape':
                event.preventDefault();
                // Clear selection (handled by main app)
                onNavigate(null);
                break;
        }
    });
    
    function focusSquare(row, col) {
        const square = boardElement.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        if (square) {
            square.focus();
        }
    }
}

// =============================================================================
// Animations
// =============================================================================

/**
 * Animate a piece moving from one square to another
 * 
 * @param {HTMLElement} boardElement - Board container
 * @param {Object} from - Source coordinates
 * @param {Object} to - Destination coordinates
 * @returns {Promise} Resolves when animation completes
 */
export function animateMove(boardElement, from, to) {
    return new Promise((resolve) => {
        const fromSquare = boardElement.querySelector(
            `.square[data-row="${from.row}"][data-col="${from.col}"]`
        );
        const toSquare = boardElement.querySelector(
            `.square[data-row="${to.row}"][data-col="${to.col}"]`
        );
        
        if (!fromSquare || !toSquare) {
            resolve();
            return;
        }
        
        const piece = fromSquare.querySelector('.piece');
        if (!piece) {
            resolve();
            return;
        }
        
        // Calculate delta
        const fromRect = fromSquare.getBoundingClientRect();
        const toRect = toSquare.getBoundingClientRect();
        const deltaX = toRect.left - fromRect.left;
        const deltaY = toRect.top - fromRect.top;
        
        // Apply animation
        piece.classList.add('animating');
        piece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        
        // Wait for animation to complete
        setTimeout(() => {
            piece.classList.remove('animating');
            piece.style.transform = '';
            resolve();
        }, ANIMATION_DURATION);
    });
}

// =============================================================================
// Promotion Modal
// =============================================================================

/**
 * Show promotion selection modal
 * 
 * @param {HTMLDialogElement} modal - Modal element
 * @param {HTMLElement} optionsContainer - Options container
 * @param {string} color - Promoting player's color
 * @returns {Promise<string>} Selected promotion type
 */
export function showPromotionModal(modal, optionsContainer, color) {
    return new Promise((resolve) => {
        optionsContainer.innerHTML = '';
        
        const promotionTypes = [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT];
        
        promotionTypes.forEach(type => {
            const option = document.createElement('button');
            option.className = 'promotion-option';
            option.setAttribute('role', 'radio');
            option.setAttribute('aria-label', `Promote to ${getPieceName(type)}`);
            
            const pieceSymbol = PIECE_SYMBOLS[color][type];
            const pieceEl = document.createElement('span');
            pieceEl.className = `promotion-piece ${color === COLORS.WHITE ? 'white' : 'black'}`;
            pieceEl.textContent = pieceSymbol;
            
            const label = document.createElement('span');
            label.className = 'promotion-label';
            label.textContent = getPieceName(type);
            
            option.appendChild(pieceEl);
            option.appendChild(label);
            
            option.addEventListener('click', () => {
                modal.close();
                resolve(type);
            });
            
            optionsContainer.appendChild(option);
        });
        
        modal.showModal();
        
        // Focus first option for accessibility
        const firstOption = optionsContainer.querySelector('.promotion-option');
        if (firstOption) {
            firstOption.focus();
        }
    });
}

// =============================================================================
// UI Updates
// =============================================================================

/**
 * Update captured pieces display
 * 
 * @param {HTMLElement} container - Container element
 * @param {Array} pieces - Array of captured piece types
 */
export function updateCapturedPieces(container, pieces) {
    container.innerHTML = '';
    
    // Sort pieces by value (queen first, then rook, etc.)
    const pieceOrder = [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT, PIECES.PAWN];
    const sorted = [...pieces].sort((a, b) => {
        return pieceOrder.indexOf(a) - pieceOrder.indexOf(b);
    });
    
    sorted.forEach(type => {
        const pieceEl = document.createElement('span');
        pieceEl.className = 'captured-piece';
        // Show opponent's pieces (if white captured, show black pieces)
        const displayColor = container.id === 'capturedByWhite' ? COLORS.BLACK : COLORS.WHITE;
        pieceEl.textContent = PIECE_SYMBOLS[displayColor][type];
        container.appendChild(pieceEl);
    });
}

/**
 * Update move history display
 * 
 * @param {HTMLElement} container - History container
 * @param {Array} moves - Array of moves with SAN notation
 */
export function updateMoveHistory(container, moves) {
    container.innerHTML = '';
    
    for (let i = 0; i < moves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = moves[i];
        const blackMove = moves[i + 1];
        
        const row = document.createElement('div');
        row.className = 'move-row';
        
        const numCell = document.createElement('span');
        numCell.className = 'move-number';
        numCell.textContent = `${moveNum}.`;
        
        const whiteCell = document.createElement('span');
        whiteCell.className = 'move-white';
        whiteCell.textContent = whiteMove?.san || '';
        
        const blackCell = document.createElement('span');
        blackCell.className = 'move-black';
        blackCell.textContent = blackMove?.san || '';
        
        row.appendChild(numCell);
        row.appendChild(whiteCell);
        row.appendChild(blackCell);
        
        container.appendChild(row);
    }
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Update game status display
 * 
 * @param {HTMLElement} element - Status element
 * @param {Object} state - Current game state
 */
export function updateGameStatus(element, state) {
    const { turn, isGameOver, gameOverReason, winner } = state;
    
    element.className = 'status-display';
    
    if (isGameOver) {
        switch (gameOverReason) {
            case 'checkmate':
                element.textContent = `Checkmate! ${winner === COLORS.WHITE ? 'White' : 'Black'} wins!`;
                element.classList.add('checkmate');
                break;
            case 'stalemate':
                element.textContent = 'Stalemate - Draw';
                element.classList.add('stalemate');
                break;
            case 'threefold-repetition':
                element.textContent = 'Draw by Threefold Repetition';
                element.classList.add('stalemate');
                break;
            case 'fifty-move-rule':
                element.textContent = 'Draw by 50-Move Rule';
                element.classList.add('stalemate');
                break;
            default:
                element.textContent = 'Game Over';
        }
    } else {
        const playerName = turn === COLORS.WHITE ? 'White' : 'Black';
        element.textContent = `${playerName} to move`;
        
        if (isInCheck(state, turn)) {
            element.textContent += ' - Check!';
        }
    }
}

/**
 * Flip the board visually
 * 
 * @param {HTMLElement} container - Board container
 * @param {boolean} isFlipped - Whether to flip
 */
export function setBoardFlipped(container, isFlipped) {
    if (isFlipped) {
        container.classList.add('flipped');
    } else {
        container.classList.remove('flipped');
    }
}

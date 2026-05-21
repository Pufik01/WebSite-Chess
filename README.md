# Chess Game - Vanilla JavaScript

A complete, production-ready chess game built with vanilla HTML5, CSS3, and JavaScript (ES6+). Zero external libraries, frameworks, or CDNs.

## Features

### Complete Chess Rules
- ✅ Legal move generation for all piece types
- ✅ Check, checkmate, and stalemate detection
- ✅ Castling (kingside and queenside) with all restrictions
- ✅ En passant captures
- ✅ Pawn promotion with UI selector
- ✅ Threefold repetition detection
- ✅ 50-move rule
- ✅ Insufficient material draw

### User Interface
- ✅ Elegant, modern board with smooth animations
- ✅ Click-to-select → click-to-move interaction
- ✅ Visual highlights: legal moves, last move, check warning
- ✅ Captured pieces display
- ✅ Algebraic move history
- ✅ Dark/light theme toggle with system preference detection
- ✅ Board flip option
- ✅ Undo functionality
- ✅ Fully responsive (320px mobile to 4K desktop)
- ✅ Touch-optimized for mobile devices

### Accessibility
- ✅ ARIA roles for board and pieces
- ✅ Keyboard navigation (arrow keys + Enter/Space)
- ✅ Focus management
- ✅ Screen-reader friendly announcements
- ✅ prefers-reduced-motion support

### Technical Features
- ✅ FEN import/export
- ✅ PGN-compatible move history export
- ✅ Web Audio API sound effects (move, capture, check, game over)
- ✅ Immutable state updates
- ✅ Modular ES6+ architecture

## Project Structure

```
/workspace
├── index.html          # Main HTML document
├── css/
│   └── styles.css      # All styles with CSS custom properties
└── js/
    ├── main.js         # Bootstrap & UI wiring
    ├── game.js         # Rules, validation, state, history
    ├── board.js        # DOM rendering, interactions, animations
    └── utils.js        # FEN, algebraic notation, helpers
```

## How to Run

1. **Open in Browser**: Simply open `index.html` in any modern web browser
   ```bash
   # Using a local server (recommended for ES modules)
   python3 -m http.server 8000
   # Then navigate to http://localhost:8000
   ```

2. **Direct File Access**: Some browsers allow opening the file directly

## How to Play

1. **Select a piece** by clicking on it (or tapping on mobile)
2. **Legal moves** are shown with dots (empty squares) or rings (captures)
3. **Click on a highlighted square** to move
4. **Pawn promotion** shows a modal to select the new piece
5. **Keyboard users** can navigate with arrow keys and press Enter/Space to select/move

## Controls

- **New Game**: Start a fresh game
- **Undo**: Take back the last move
- **Flip Board**: View from black's perspective
- **Theme Toggle**: Switch between light and dark modes
- **Export FEN**: Copy current position as FEN string
- **Import FEN**: Load a position from FEN string
- **Export PGN**: Download game history in PGN format

## Extending the Game

### Add WebSocket Multiplayer
```javascript
// In main.js, replace local move execution with:
socket.emit('makeMove', move);
socket.on('opponentMove', (move) => {
    appState.gameState = executeMove(appState.gameState, move);
    render();
});
```

### Add Minimax AI
Create an ai.js module with minimax algorithm and alpha-beta pruning for computer opponents.

## Known Limitations

1. **Disambiguation in SAN**: Simplified disambiguation in algebraic notation
2. **Draw Claims**: Automatically enforced rather than player-claimed
3. **Audio**: Requires user interaction to initialize (browser policy)
4. **No Clock**: Chess timer not implemented
5. **No Analysis**: No move suggestions or evaluation

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

ES6 modules and modern CSS features required.

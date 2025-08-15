import { Chess } from 'chess.js';

export interface GameState {
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  piece: string;
  captured?: string;
}

export class ChessUtils {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  /**
   * Load a game from PGN string
   */
  loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      return true;
    } catch (error) {
      console.error('Invalid PGN:', error);
      return false;
    }
  }

  /**
   * Load a position from FEN string
   */
  loadFen(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch (error) {
      console.error('Invalid FEN:', error);
      return false;
    }
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return {
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      turn: this.chess.turn(),
      isGameOver: this.chess.isGameOver(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
    };
  }

  /**
   * Make a move
   */
  makeMove(from: string, to: string, promotion?: string): Move | null {
    try {
      const move = this.chess.move({
        from,
        to,
        promotion,
      });
      
      if (move) {
        return {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: move.san,
          piece: move.piece,
          captured: move.captured,
        };
      }
      return null;
    } catch (error) {
      console.error('Invalid move:', error);
      return null;
    }
  }

  /**
   * Get all legal moves for current position
   */
  getLegalMoves(): string[] {
    return this.chess.moves();
  }

  /**
   * Get legal moves for a specific square
   */
  getLegalMovesForSquare(square: string): string[] {
    return this.chess.moves({ square: square as any, verbose: false });
  }

  /**
   * Check if a move is legal
   */
  isLegalMove(from: string, to: string): boolean {
    const moves = this.chess.moves({ verbose: true });
    return moves.some(move => move.from === from && move.to === to);
  }

  /**
   * Undo the last move
   */
  undoMove(): Move | null {
    const move = this.chess.undo();
    if (move) {
      return {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        san: move.san,
        piece: move.piece,
        captured: move.captured,
      };
    }
    return null;
  }

  /**
   * Get the piece at a square
   */
  getPiece(square: string): { type: string; color: string } | null {
    const piece = this.chess.get(square as any);
    return piece ? { type: piece.type, color: piece.color } : null;
  }

  /**
   * Get the current board position as a 2D array
   */
  getBoard(): (null | { type: string; color: string })[][] {
    return this.chess.board();
  }

  /**
   * Reset the game to starting position
   */
  reset(): void {
    this.chess.reset();
  }

  /**
   * Get move history
   */
  getHistory(): string[] {
    return this.chess.history();
  }

  /**
   * Get move history with detailed information
   */
  getDetailedHistory(): Move[] {
    return this.chess.history({ verbose: true }).map(move => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      san: move.san,
      piece: move.piece,
      captured: move.captured,
    }));
  }

  /**
   * Export current game as PGN
   */
  exportPgn(): string {
    return this.chess.pgn();
  }

  /**
   * Export current position as FEN
   */
  exportFen(): string {
    return this.chess.fen();
  }

  /**
   * Check if position is threefold repetition
   */
  isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  /**
   * Check if position is insufficient material
   */
  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  /**
   * Get squares that are under attack by the current player
   */
  getAttackedSquares(): string[] {
    const squares: string[] = [];
    const board = this.chess.board();
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = String.fromCharCode(97 + file) + (8 - rank);
        if (this.chess.isAttacked(square as any, this.chess.turn())) {
          squares.push(square);
        }
      }
    }
    
    return squares;
  }
}

/**
 * Utility function to convert square notation to coordinates
 */
export function squareToCoords(square: string): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = parseInt(square[1]) - 1; // 1=0, 2=1, etc.
  return { file, rank };
}

/**
 * Utility function to convert coordinates to square notation
 */
export function coordsToSquare(file: number, rank: number): string {
  return String.fromCharCode(97 + file) + (rank + 1);
}

/**
 * Get piece Unicode symbol
 */
export function getPieceSymbol(piece: { type: string; color: string }): string {
  const symbols: { [key: string]: string } = {
    'wk': '♔', 'wq': '♕', 'wr': '♖', 'wb': '♗', 'wn': '♘', 'wp': '♙',
    'bk': '♚', 'bq': '♛', 'br': '♜', 'bb': '♝', 'bn': '♞', 'bp': '♟',
  };
  
  return symbols[piece.color + piece.type] || '';
}

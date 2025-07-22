import { Chess } from 'chess.js';

export type ChessMove = {
  from: string;
  to: string;
  promotion?: string;
};

export type ChessGame = {
  chess: Chess;
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
};

export function createChessGame(fen?: string): ChessGame {
  const chess = new Chess(fen);
  
  return {
    chess,
    fen: chess.fen(),
    pgn: chess.pgn(),
    turn: chess.turn(),
    isGameOver: chess.isGameOver(),
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
  };
}

export function makeMove(game: ChessGame, move: ChessMove): ChessGame | null {
  try {
    const moveResult = game.chess.move(move);
    
    if (!moveResult) {
      return null; // Invalid move
    }
    
    return {
      chess: game.chess,
      fen: game.chess.fen(),
      pgn: game.chess.pgn(),
      turn: game.chess.turn(),
      isGameOver: game.chess.isGameOver(),
      isCheck: game.chess.isCheck(),
      isCheckmate: game.chess.isCheckmate(),
      isStalemate: game.chess.isStalemate(),
      isDraw: game.chess.isDraw(),
    };
  } catch (error) {
    return null; // Invalid move
  }
}

export function getLegalMoves(game: ChessGame, square?: string): string[] {
  if (square) {
    return game.chess.moves({
      square: square as any,
      verbose: false,
    });
  }
  
  return game.chess.moves();
}

export function isValidMove(game: ChessGame, move: ChessMove): boolean {
  try {
    const tempChess = new Chess(game.fen);
    const result = tempChess.move(move);
    return result !== null;
  } catch (error) {
    return false;
  }
}

export function getGameStatus(game: ChessGame): string {
  if (game.isCheckmate) {
    return game.turn === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
  }
  
  if (game.isStalemate) {
    return 'Draw by stalemate';
  }
  
  if (game.isDraw) {
    return 'Draw';
  }
  
  if (game.isCheck) {
    return game.turn === 'w' ? 'White is in check' : 'Black is in check';
  }
  
  return game.turn === 'w' ? "White's turn" : "Black's turn";
}

export function parsePGN(pgn: string): ChessMove[] {
  const chess = new Chess();
  
  try {
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    
    return history.map(move => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    }));
  } catch (error) {
    return [];
  }
}

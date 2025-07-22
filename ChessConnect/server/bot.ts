
import { Chess } from "chess.js";

export interface BotMove {
  move: string;
  evaluation?: number;
}

export class ChessBot {
  private difficulty: 'easy' | 'medium' | 'hard';
  private chess: Chess;

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
    this.chess = new Chess();
  }

  // Piece values for evaluation
  private getPieceValue(piece: string): number {
    const values: { [key: string]: number } = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0,
      'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0
    };
    return values[piece] || 0;
  }

  // Simple position evaluation
  private evaluatePosition(): number {
    const board = this.chess.board();
    let evaluation = 0;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = this.getPieceValue(piece.type);
          if (piece.color === 'w') {
            evaluation += value;
          } else {
            evaluation -= value;
          }
        }
      }
    }

    return evaluation;
  }

  // Minimax algorithm with alpha-beta pruning
  private minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0 || this.chess.isGameOver()) {
      return this.evaluatePosition();
    }

    const moves = this.chess.moves();
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        this.chess.move(move);
        const evaluation = this.minimax(depth - 1, alpha, beta, false);
        this.chess.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.chess.move(move);
        const evaluation = this.minimax(depth - 1, alpha, beta, true);
        this.chess.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Get best move based on difficulty
  public getBestMove(fen: string): BotMove {
    this.chess.load(fen);
    const moves = this.chess.moves();
    
    if (moves.length === 0) {
      throw new Error("No legal moves available");
    }

    switch (this.difficulty) {
      case 'easy':
        return this.getRandomMove();
      
      case 'medium':
        return this.getMediumMove();
      
      case 'hard':
        return this.getHardMove();
      
      default:
        return this.getRandomMove();
    }
  }

  private getRandomMove(): BotMove {
    const moves = this.chess.moves();
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return { move: randomMove };
  }

  private getMediumMove(): BotMove {
    const moves = this.chess.moves();
    let bestMove = moves[0];
    let bestEvaluation = -Infinity;

    // Look for captures and checks first
    for (const move of moves) {
      this.chess.move(move);
      let evaluation = this.evaluatePosition();
      
      // Bonus for checks
      if (this.chess.isCheck()) {
        evaluation += 0.5;
      }
      
      // Add some randomness for medium difficulty
      evaluation += (Math.random() - 0.5) * 2;
      
      if (evaluation > bestEvaluation) {
        bestEvaluation = evaluation;
        bestMove = move;
      }
      
      this.chess.undo();
    }

    return { move: bestMove, evaluation: bestEvaluation };
  }

  private getHardMove(): BotMove {
    const moves = this.chess.moves();
    let bestMove = moves[0];
    let bestEvaluation = -Infinity;
    const isWhite = this.chess.turn() === 'w';

    for (const move of moves) {
      this.chess.move(move);
      const evaluation = this.minimax(3, -Infinity, Infinity, !isWhite);
      
      if (evaluation > bestEvaluation) {
        bestEvaluation = evaluation;
        bestMove = move;
      }
      
      this.chess.undo();
    }

    return { move: bestMove, evaluation: bestEvaluation };
  }
}

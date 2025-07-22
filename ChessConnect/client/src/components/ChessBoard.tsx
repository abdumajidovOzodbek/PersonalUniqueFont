import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ChessBoardProps {
  gameId: string | undefined;
  orientation: 'white' | 'black';
  isPlayerTurn: boolean;
  gameStatus: string;
  fen: string;
}

export default function ChessBoard({ gameId, fen, orientation, isPlayerTurn, gameStatus }: ChessBoardProps) {
  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState<Square[][]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const moveMutation = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const response = await fetch(`/api/games/${gameId}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          move: from + to,
          moveNumber: chess.history().length + 1,
          fen: chess.fen(),
          timeRemaining: 600, // Default time
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to make move');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "moves"] });
      setSelectedSquare(null);
      setPossibleMoves([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Move Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const initializeBoard = useCallback(() => {
    try {
      chess.load(fen);
      const boardArray: Square[][] = [];

      for (let rank = 7; rank >= 0; rank--) {
        const row: Square[] = [];
        for (let file = 0; file < 8; file++) {
          const square = String.fromCharCode(97 + file) + (rank + 1);
          const piece = chess.get(square as any);
          const isLight = (rank + file) % 2 === 1;

          row.push({
            piece: piece ? `${piece.color}${piece.type}` : null,
            color: isLight ? 'light' : 'dark',
            position: square,
          });
        }
        boardArray.push(row);
      }

      if (orientation === 'black') {
        setBoard(boardArray.reverse().map(row => row.reverse()));
      } else {
        setBoard(boardArray);
      }
    } catch (error) {
      console.error('Error initializing board:', error);
    }
  }, [fen, orientation, chess]);

  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  const handleSquareClick = (square: string) => {
    if (gameStatus !== 'active' || !isPlayerTurn) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    if (selectedSquare && possibleMoves.includes(square)) {
      // Make move
      const move = chess.move({ from: selectedSquare, to: square });
      if (move) {
        moveMutation.mutate({ from: selectedSquare, to: square });
      }
      return;
    }

    // Select new square
    const piece = chess.get(square as any);
    if (piece && ((chess.turn() === 'w' && piece.color === 'w') || (chess.turn() === 'b' && piece.color === 'b'))) {
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as any, verbose: true });
      setPossibleMoves(moves.map(move => move.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const getPieceSymbol = (piece: string | null) => {
    if (!piece) return '';

    const symbols: { [key: string]: string } = {
      'wp': '♙', 'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔',
      'bp': '♟', 'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚',
    };

    return symbols[piece] || '';
  };

  return (
    <div className="w-96 h-96 border-2 border-gray-800 mx-auto">
      {board.map((row, rankIndex) => (
        <div key={rankIndex} className="flex">
          {row.map((square, fileIndex) => (
            <div
              key={`${rankIndex}-${fileIndex}`}
              className={`
                w-12 h-12 flex items-center justify-center cursor-pointer text-3xl select-none
                ${square.color === 'light' ? 'bg-amber-100' : 'bg-amber-800'}
                ${selectedSquare === square.position ? 'ring-4 ring-blue-500' : ''}
                ${possibleMoves.includes(square.position) ? 'ring-2 ring-green-500' : ''}
                ${!isPlayerTurn || gameStatus !== 'active' ? 'cursor-not-allowed opacity-75' : ''}
              `}
              onClick={() => handleSquareClick(square.position)}
            >
              {getPieceSymbol(square.piece)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import ChessBoard from "@/components/ChessBoard";
import GameChat from "@/components/GameChat";
import MoveHistory from "@/components/MoveHistory";
import PlayerInfo from "@/components/PlayerInfo";
import GameControls from "@/components/GameControls";
import { Card, CardContent } from "@/components/ui/card";
import type { Game, User } from "@shared/schema";

export default function Game() {
  const params = useParams();
  const gameId = params.id;
  const { user, isLoading: authLoading } = useAuth();

  // Add comprehensive validation for gameId
  const isValidGameId = gameId && gameId !== 'undefined' && gameId !== 'null' && gameId.length > 0;

  const { data: game, isLoading: gameLoading, error: gameError } = useQuery({
    queryKey: ["/api/games", gameId],
    enabled: isValidGameId,
    refetchInterval: 5000,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 or 400 error
      if (error?.response?.status === 404 || error?.response?.status === 400) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const { data: moves = [], isLoading: movesLoading } = useQuery({
    queryKey: ["/api/games", gameId, "moves"],
    enabled: isValidGameId && !!game,
    refetchInterval: 3000,
  });

  if (!isValidGameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Game</h1>
          <p className="text-gray-600 mt-2">Game ID is missing or invalid</p>
          <p className="text-sm text-gray-500 mt-1">Received ID: {gameId || 'undefined'}</p>
        </div>
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Game Not Found</h1>
          <p className="text-gray-600 mt-2">The requested game could not be loaded</p>
        </div>
      </div>
    );
  }

  const { toast } = useToast();

  useEffect(() => {
    if (gameError && isUnauthorizedError(gameError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [gameError, toast]);


  if (authLoading || gameLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading game...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Game Not Found</h2>
                <p className="text-gray-600">The requested game could not be found.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const gameData = game as Game & { whitePlayer: User | null; blackPlayer: User | null };
  const isWhitePlayer = gameData.whitePlayerId === user?.id;
  const isBlackPlayer = gameData.blackPlayerId === user?.id;
  const isPlayerInGame = isWhitePlayer || isBlackPlayer;

  if (!isPlayerInGame) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-gray-600">You are not a player in this game.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const opponent = isWhitePlayer ? gameData.blackPlayer : gameData.whitePlayer;
  const currentPlayer = isWhitePlayer ? gameData.whitePlayer : gameData.blackPlayer;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Game Board Area */}
          <div className="lg:col-span-8">
            <Card>
              <CardContent className="p-6">
                {/* Opponent Info */}
                <PlayerInfo
                  player={opponent}
                  timeRemaining={isWhitePlayer ? gameData.blackTimeRemaining : gameData.whiteTimeRemaining}
                  isCurrentTurn={
                    (gameData.currentTurn === 'white' && !isWhitePlayer) ||
                    (gameData.currentTurn === 'black' && !isBlackPlayer)
                  }
                  className="mb-6"
                />

                {/* Chess Board */}
                <div className="flex justify-center mb-6">
                  <ChessBoard
                    gameId={gameId || gameData.id}
                    fen={gameData.fen}
                    orientation={isWhitePlayer ? 'white' : 'black'}
                    isPlayerTurn={
                      (gameData.currentTurn === 'white' && isWhitePlayer) ||
                      (gameData.currentTurn === 'black' && isBlackPlayer)
                    }
                    gameStatus={gameData.status}
                  />
                </div>

                {/* Current Player Info */}
                <PlayerInfo
                  player={currentPlayer}
                  timeRemaining={isWhitePlayer ? gameData.whiteTimeRemaining : gameData.blackTimeRemaining}
                  isCurrentTurn={
                    (gameData.currentTurn === 'white' && isWhitePlayer) ||
                    (gameData.currentTurn === 'black' && isBlackPlayer)
                  }
                  isCurrentPlayer={true}
                />
              </CardContent>
            </Card>

            {/* Game Controls */}
            <GameControls gameId={gameId || gameData.id} gameStatus={gameData.status} className="mt-4" />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Game Chat */}
            <GameChat gameId={gameId || gameData.id} />

            {/* Move History */}
            <MoveHistory moves={moves || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
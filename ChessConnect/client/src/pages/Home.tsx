import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";

import { Play, Clock, Trophy, Target, History, Users } from "lucide-react";
import { useLocation } from "wouter";
import type { Game, User } from "@shared/schema";

function RecentGamesSection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 5;

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["/api/users/games", user?.id, currentPage],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await apiRequest("GET", `/api/users/${user.id}/games?page=${currentPage}&limit=${gamesPerPage}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const getGameResult = (game: Game) => {
    if (game.status !== 'completed') return 'In Progress';
    if (game.result === 'draw') return 'Draw';
    
    const isWhite = game.whitePlayerId === user?.id;
    if (game.result === 'white_wins') {
      return isWhite ? 'Win' : 'Loss';
    } else if (game.result === 'black_wins') {
      return isWhite ? 'Loss' : 'Win';
    }
    return 'Unknown';
  };

  const getResultBadgeVariant = (result: string) => {
    switch (result) {
      case 'Win':
        return 'default';
      case 'Loss':
        return 'destructive';
      case 'Draw':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatTimeControl = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const handleViewGame = (gameId: string) => {
    setLocation(`/game/${gameId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Recent Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Recent Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        {games.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No games played yet</p>
            <p className="text-sm">Start your first match above!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {games.map((game: Game) => {
                const result = getGameResult(game);
                const isWhite = game.whitePlayerId === user?.id;
                const playerColor = isWhite ? 'White' : 'Black';
                const opponentName = isWhite ? 'Black Player' : 'White Player';
                
                return (
                  <div
                    key={game._id || game.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <div>
                        <p className="font-medium">vs {opponentName}</p>
                        <p className="text-sm text-gray-500">
                          {playerColor} • {formatTimeControl(game.timeControl || 600)} • {new Date(game.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getResultBadgeVariant(result)}>
                        {result}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewGame(game._id?.toString() || game.id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={games.length < gamesPerPage}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  const { data: recentGames } = useQuery({
    queryKey: ["/api/users", user?.id, "games"],
    enabled: !!user?.id,
  });

  const matchmakingMutation = useMutation({
    mutationFn: async (timeControl: number) => {
      const response = await apiRequest("POST", "/api/matchmaking", {
        timeControl,
        ratingRange: 200,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.matched) {
        toast({
          title: "Match Found!",
          description: "Starting your game...",
        });
        const gameId = data.game._id || data.game.id;
        console.log("Navigating to game ID:", gameId);
        if (gameId && gameId !== 'undefined') {
          setLocation(`/game/${gameId}`);
        } else {
          toast({
            title: "Error",
            description: "Invalid game ID received from matchmaking.",
            variant: "destructive",
          });
        }
      } else {
        setIsMatchmaking(true);
        toast({
          title: "Searching for Opponent",
          description: "We'll notify you when a match is found.",
        });

        // Poll for match every 3 seconds
        const pollInterval = setInterval(async () => {
          try {
            const response = await apiRequest("GET", "/api/matchmaking/status");
            const result = await response.json();

            if (result.matched) {
              clearInterval(pollInterval);
              setIsMatchmaking(false);
              toast({
                title: "Match Found!",
                description: "Starting your game...",
              });
              const gameId = result.game._id || result.game.id;
              console.log("Polling found game ID:", gameId);
              if (gameId && gameId !== 'undefined') {
                setLocation(`/game/${gameId}`);
              } else {
                toast({
                  title: "Error", 
                  description: "Invalid game ID received from matchmaking.",
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            clearInterval(pollInterval);
            setIsMatchmaking(false);
            if (isUnauthorizedError(error as Error)) {
              toast({
                title: "Unauthorized",
                description: "You are logged out. Logging in again...",
                variant: "destructive",
              });
              setTimeout(() => {
                window.location.href = "/api/login";
              }, 500);
            }
          }
        }, 3000);

        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsMatchmaking(false);
          toast({
            title: "No Match Found",
            description: "Try again later or adjust your settings.",
            variant: "destructive",
          });
        }, 120000);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to start matchmaking. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const cancelMatchmakingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/matchmaking");
      return response.json();
    },
    onSuccess: () => {
      setIsMatchmaking(false);
      toast({
        title: "Matchmaking Canceled",
        description: "You can start a new search anytime.",
      });
    },
  });

  const botGameMutation = useMutation({
    mutationFn: async ({ difficulty, playerColor }: { difficulty: string, playerColor: string }) => {
      const response = await apiRequest("POST", "/api/games/bot", {
        difficulty,
        timeControl: 600,
        playerColor,
      });
      return response.json();
    },
    onSuccess: (game) => {
      toast({
        title: "Bot Game Started!",
        description: "Good luck against the computer!",
      });
      const gameId = game._id || game.id;
      if (gameId && gameId !== 'undefined') {
        setLocation(`/game/${gameId}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create bot game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickPlay = (timeControl: number) => {
    if (isMatchmaking) {
      cancelMatchmakingMutation.mutate();
    } else {
      matchmakingMutation.mutate(timeControl);
    }
  };

  const handleBotPlay = (difficulty: 'easy' | 'medium' | 'hard') => {
    botGameMutation.mutate({ 
      difficulty, 
      playerColor: Math.random() > 0.5 ? 'white' : 'black' 
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Welcome Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Welcome back, {user?.firstName || 'Player'}!
                </CardTitle>
                <p className="text-gray-600">Ready for your next chess match?</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleQuickPlay(600)}
                    disabled={matchmakingMutation.isPending || cancelMatchmakingMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 h-16"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {isMatchmaking ? "Cancel Search" : "Quick Play (10 min)"}
                  </Button>
                  <Button
                    onClick={() => handleQuickPlay(300)}
                    disabled={matchmakingMutation.isPending || cancelMatchmakingMutation.isPending}
                    variant="outline"
                    className="h-16"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Blitz (5 min)
                  </Button>
                  <Button
                    onClick={() => handleQuickPlay(1800)}
                    disabled={matchmakingMutation.isPending || cancelMatchmakingMutation.isPending}
                    variant="outline"
                    className="h-16"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    Classic (30 min)
                  </Button>
                </div>

                <Separator className="my-6" />

                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Play Against Computer</h3>
                  <p className="text-gray-600 text-sm">Practice with different difficulty levels</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleBotPlay('easy')}
                    disabled={matchmakingMutation.isPending || cancelMatchmakingMutation.isPending}
                    variant="outline"
                    className="h-16"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    Easy Bot
                  </Button>
                  <Button
                    onClick={() => handleBotPlay('medium')}
                    disabled={matchmakingMutation.isPending || cancelMatchmakingMutation.isPending}
                    variant="outline"
                    className="h-16"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Medium Bot
                  </Button>
                  <Button
                    onClick={() => handleBotPlay('hard')}
                    disabled={matchmakingMutation.isPending || cancelMatchmakingMutation.isPending}
                    variant="outline"
                    className="h-16"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Hard Bot
                  </Button>
                </div>

                {isMatchmaking && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-blue-800 font-medium">Searching for opponent...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Games */}
            <RecentGamesSection />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Player Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-bold text-lg">{user?.rating || 1200}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{user?.wins || 0}</p>
                      <p className="text-sm text-gray-600">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{user?.losses || 0}</p>
                      <p className="text-sm text-gray-600">Losses</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-600">{user?.draws || 0}</p>
                    <p className="text-sm text-gray-600">Draws</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Games</span>
                    <span className="font-medium">{user?.gamesPlayed || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    Daily Puzzles
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/leaderboard')}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Find Friends
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
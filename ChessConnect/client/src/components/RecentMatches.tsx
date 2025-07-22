
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Game } from "@shared/schema";

export default function RecentMatches() {
  const { user } = useAuth();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!user) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Recent Matches
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
          <Calendar className="w-5 h-5 mr-2" />
          Recent Matches
        </CardTitle>
      </CardHeader>
      <CardContent>
        {games.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No games played yet</p>
            <p className="text-sm">Start a game to see your match history!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {games.map((game: Game) => {
                const result = getGameResult(game);
                const isWhite = game.whitePlayerId === user.id;
                const playerColor = isWhite ? 'White' : 'Black';
                
                return (
                  <div
                    key={game._id || game.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant={getResultBadgeVariant(result)}>
                        {result}
                      </Badge>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{playerColor}</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeControl(game.timeControl || 600)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(game.createdAt)}
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
                <ChevronLeft className="w-4 h-4 mr-1" />
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
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

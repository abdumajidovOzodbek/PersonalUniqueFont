
import Navigation from "@/components/Navigation";
import Leaderboard from "@/components/Leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LeaderboardPage() {
  const { user, isLoading: authLoading } = useAuth();

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Top players ranked by rating</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <Leaderboard />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Your Rank */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{user.rating}</div>
                      <div className="text-sm text-gray-600">Current Rating</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-green-600">{user.wins}</div>
                        <div className="text-xs text-gray-600">Wins</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-red-600">{user.losses}</div>
                        <div className="text-xs text-gray-600">Losses</div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-600">{user.draws}</div>
                      <div className="text-xs text-gray-600">Draws</div>
                    </div>

                    <div className="text-center pt-2 border-t">
                      <div className="text-sm text-gray-600">
                        {user.gamesPlayed} total games
                      </div>
                      {user.gamesPlayed > 0 && (
                        <div className="text-sm text-gray-600">
                          {((user.wins / user.gamesPlayed) * 100).toFixed(1)}% win rate
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rating Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Trophy className="w-5 h-5 mr-2" />
                  Rating System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win:</span>
                    <span className="font-medium text-green-600">+25 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loss:</span>
                    <span className="font-medium text-red-600">-25 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Draw:</span>
                    <span className="font-medium text-gray-600">+5 points</span>
                  </div>
                  <div className="pt-2 border-t text-xs text-gray-500">
                    <p>Starting rating: 1200</p>
                    <p>Minimum rating: 800</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to Rank Up */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Rank Up Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li>• Play more games to improve</li>
                  <li>• Study your game history</li>
                  <li>• Practice against bots</li>
                  <li>• Focus on endgame tactics</li>
                  <li>• Learn common openings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

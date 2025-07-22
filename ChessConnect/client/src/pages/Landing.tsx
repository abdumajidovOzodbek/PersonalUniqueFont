import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sword, Play, Users, TrendingUp, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  const guestLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/guest");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "Playing as guest. You can start playing immediately.",
      });
      // Invalidate auth queries and refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.reload(); // Refresh to update auth state
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create guest account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGuestPlay = () => {
    guestLoginMutation.mutate();
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-green-600">
                  <Sword className="inline-block w-8 h-8 mr-2" />
                  OpenChess
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowLoginModal(true)}
                variant="outline"
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button onClick={handleGuestPlay} disabled={guestLoginMutation.isPending}>
                <Play className="w-4 h-4 mr-2" />
                {guestLoginMutation.isPending ? "Creating..." : "Quick Play"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Play Sword Online
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Challenge players from around the world in this modern chess platform.
            Improve your skills, track your progress, and enjoy the timeless game of chess.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGuestPlay}
              disabled={guestLoginMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-5 h-5 mr-2" />
              {guestLoginMutation.isPending ? "Creating Account..." : "Play as Guest"}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleLogin}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Sign In to Save Progress
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-2 text-blue-600" />
                Real-time Multiplayer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Play against real opponents with instant move synchronization and live chat.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
                Rating System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track your progress with an ELO rating system and climb the leaderboards.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-6 h-6 mr-2 text-yellow-600" />
                Game Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Review your games with move history and learn from your matches.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sword Board Preview */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Beautiful, Interactive Sword Board
          </h2>
          <div className="inline-block">
            <div className="border-4 border-gray-800 rounded-lg shadow-xl">
              <div className="grid grid-cols-8 gap-0" style={{ width: "320px", height: "320px" }}>
                {/* Simplified chess board for preview */}
                {Array.from({ length: 64 }, (_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const isLight = (row + col) % 2 === 0;
                  const pieces = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
                  
                  let piece = '';
                  if (row === 0) piece = pieces[col];
                  else if (row === 1) piece = '♟';
                  else if (row === 6) piece = '♙';
                  else if (row === 7) piece = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'][col];
                  
                  return (
                    <div
                      key={i}
                      className={`w-10 h-10 flex items-center justify-center text-2xl ${
                        isLight ? 'bg-amber-100' : 'bg-amber-800'
                      }`}
                    >
                      {piece}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Welcome to OpenChess</CardTitle>
              <p className="text-center text-gray-600">Choose how you'd like to play</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGuestPlay} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={guestLoginMutation.isPending}
              >
                <Users className="w-4 h-4 mr-2" />
                {guestLoginMutation.isPending ? "Creating..." : "Play as Guest"}
              </Button>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email or Username</Label>
                  <Input id="email" type="text" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" className="mt-1" />
                </div>
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-gray-900 hover:bg-gray-800"
                >
                  Sign In
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button 
                    onClick={handleLogin}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowLoginModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

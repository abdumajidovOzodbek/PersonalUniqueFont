import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useEffect } from "react";

interface GameControlsProps {
  gameId: string | undefined;
  gameStatus: string;
  className?: string;
}

export default function GameControls({ gameId, gameStatus, className }: GameControlsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for pending draw offers
  const { data: drawOffers = [] } = useQuery({
    queryKey: ["/api/games", gameId, "draw-offers"],
    enabled: !!gameId && gameId !== 'undefined' && gameStatus === 'active',
    refetchInterval: 3000,
  });

  const resignMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/games/${gameId}/resign`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resign');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
      toast({
        title: "Game Resigned",
        description: "You have resigned from the game.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const offerDrawMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/games/${gameId}/draw-offer`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to offer draw');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Draw Offered",
        description: "Draw offer sent to opponent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const respondToDrawMutation = useMutation({
    mutationFn: async (accept: boolean) => {
      const response = await fetch(`/api/games/${gameId}/draw-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accept }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to respond to draw');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "draw-offers"] });
      
      if (data.accepted) {
        toast({
          title: "Draw Accepted",
          description: "Game ended in a draw.",
        });
      } else {
        toast({
          title: "Draw Declined",
          description: "Draw offer declined.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Show toast notification when draw offer is received
  useEffect(() => {
    if (drawOffers.length > 0) {
      toast({
        title: "Draw Offer Received",
        description: "Your opponent has offered a draw. Check the Game Controls to respond.",
        duration: 5000,
      });
    }
  }, [drawOffers.length, toast]);

  if (gameStatus !== 'active' || !gameId || gameId === 'undefined') {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Draw offer notification */}
        {drawOffers.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Your opponent has offered a draw!
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => respondToDrawMutation.mutate(true)}
                disabled={respondToDrawMutation.isPending}
                className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
              >
                Accept Draw
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => respondToDrawMutation.mutate(false)}
                disabled={respondToDrawMutation.isPending}
                className="bg-red-50 border-red-200 hover:bg-red-100 text-red-700"
              >
                Decline Draw
              </Button>
            </div>
          </div>
        )}

        {/* Game control buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => offerDrawMutation.mutate()}
            disabled={offerDrawMutation.isPending || drawOffers.length > 0}
          >
            Offer Draw
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={resignMutation.isPending}>
                Resign
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resign Game</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to resign? This action cannot be undone and you will lose the game.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resignMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Resign
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
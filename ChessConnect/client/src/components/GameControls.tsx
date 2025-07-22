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

  if (gameStatus !== 'active' || !gameId || gameId === 'undefined') {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => offerDrawMutation.mutate()}
          disabled={offerDrawMutation.isPending}
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
      </CardContent>
    </Card>
  );
}
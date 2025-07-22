import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface PlayerInfoProps {
  player: User | null;
  timeRemaining?: number | null;
  isCurrentTurn: boolean;
  isCurrentPlayer?: boolean;
  className?: string;
}

export default function PlayerInfo({ 
  player, 
  timeRemaining, 
  isCurrentTurn, 
  isCurrentPlayer = false,
  className 
}: PlayerInfoProps) {
  const formatTime = (seconds?: number | null) => {
    if (!seconds && seconds !== 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPlayerDisplayName = (player: User | null) => {
    if (!player) return "Unknown Player";

    if (player.id.startsWith('guest_')) {
      return 'Guest Player';
    }

    if (player.firstName && player.lastName) {
      return `${player.firstName} ${player.lastName}`;
    }

    return player.firstName || 'Player';
  };

  const getPlayerInitials = (player: User | null) => {
    if (!player) return "?";

    if (player.id.startsWith('guest_')) {
      return 'G';
    }

    if (player.firstName) {
      return player.firstName[0].toUpperCase();
    }

    return player.id[0].toUpperCase();
  };

  if (!player) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">Waiting for opponent...</p>
              <p className="text-sm text-gray-500">- ⭐</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if player is a bot
  const isBot = player?.id?.startsWith('bot_');
  const botDifficulty = isBot ? player.id.split('_')[1] : null;
  const displayName = isBot ? `${botDifficulty?.charAt(0).toUpperCase()}${botDifficulty?.slice(1)} Bot` : 
    `${player.firstName} ${player.lastName}`;
  const displayRating = isBot ? 
    (botDifficulty === 'easy' ? 800 : botDifficulty === 'medium' ? 1200 : 1600) : 
    player.rating;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <Avatar className={cn(
            "w-10 h-10",
            isCurrentTurn && "ring-2 ring-green-500",
            isCurrentPlayer && "ring-2 ring-blue-500"
          )}>
            <AvatarImage src={isBot ? undefined : player.profileImageUrl || undefined} alt={displayName} />
            <AvatarFallback>
              {isBot ? '🤖' : `${player.firstName?.[0]}${player.lastName?.[0]}`}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">
              {isCurrentPlayer ? `You (${getPlayerDisplayName(player)})` : displayName}
            </p>
            <p className="text-sm text-gray-500 flex items-center">
              <Star className="w-3 h-3 mr-1" />
              {displayRating || 1200}
            </p>
          </div>
        </div>

        {(timeRemaining !== null && timeRemaining !== undefined) && (
          <Badge 
            variant={
              isCurrentTurn 
                ? timeRemaining < 60 ? "destructive" : "default"
                : "secondary"
            }
            className="font-mono"
          >
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(timeRemaining)}
          </Badge>
        )}
      </div>

      {isCurrentTurn && (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Your Turn
          </span>
        </Badge>
      )}
    </div>
  );
}
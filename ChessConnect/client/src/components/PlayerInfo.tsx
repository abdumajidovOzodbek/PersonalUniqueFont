import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Clock } from "lucide-react";
import type { User } from "@shared/schema";

interface PlayerInfoProps {
  player: User | null;
  timeRemaining: number;
  isCurrentTurn: boolean;
  isCurrentPlayer?: boolean;
  gameStatus: string;
  className?: string;
}

export default function PlayerInfo({
  player,
  timeRemaining,
  isCurrentTurn,
  isCurrentPlayer = false,
  gameStatus,
  className = "",
}: PlayerInfoProps) {
  const [currentTime, setCurrentTime] = useState(timeRemaining);

  useEffect(() => {
    setCurrentTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (isCurrentTurn && gameStatus === 'active') {
      const timer = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            // Time's up - this would need to be handled by the parent component
            clearInterval(timer);
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCurrentTurn, gameStatus]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDisplayName = (player: User | null) => {
    if (!player) return "Waiting...";
    if (player.id.startsWith('bot_')) {
      const difficulty = player.id.split('_')[1];
      return `Bot (${difficulty})`;
    }
    if (player.firstName && player.lastName) {
      return `${player.firstName} ${player.lastName}`;
    }
    return player.firstName || "Anonymous";
  };

  return (
    <Card className={`${className} ${isCurrentTurn ? 'ring-2 ring-green-500' : ''}`}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={player?.profileImageUrl} />
            <AvatarFallback>
              {getDisplayName(player).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{getDisplayName(player)}</p>
            {isCurrentPlayer && (
              <p className="text-sm text-gray-500">You</p>
            )}
          </div>
        </div>
        <div className={`flex items-center space-x-2 ${isCurrentTurn ? 'text-green-600' : 'text-gray-600'}`}>
          <Clock className="w-4 h-4" />
          <span className={`font-mono text-lg ${currentTime < 60 ? 'text-red-600' : ''}`}>
            {formatTime(currentTime)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

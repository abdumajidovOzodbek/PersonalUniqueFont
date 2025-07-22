import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Move {
  _id: string;
  moveNumber: number;
  move: string;
  createdAt: string;
}

interface MoveHistoryProps {
  moves: Move[];
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const groupedMoves = moves.reduce((acc: { [key: number]: Move[] }, move) => {
    const moveNumber = Math.ceil(move.moveNumber / 2);
    if (!acc[moveNumber]) {
      acc[moveNumber] = [];
    }
    acc[moveNumber].push(move);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Move History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {Object.keys(groupedMoves).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No moves yet</p>
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedMoves).map(([moveNumber, movePair]) => (
                <div key={moveNumber} className="flex items-center space-x-2 text-sm">
                  <span className="font-medium w-6">{moveNumber}.</span>
                  <span className="w-16">{movePair[0]?.move || ''}</span>
                  <span className="w-16">{movePair[1]?.move || ''}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
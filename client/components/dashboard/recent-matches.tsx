import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Match {
  id: string
  wagerAmount: number
  wagerTier: string
  status: string
  completedAt: string
  isWinner: boolean
}

interface RecentMatchesProps {
  matches: Match[]
  className?: string
}

export default function RecentMatches({ matches, className }: RecentMatchesProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Match Results</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No recent matches</p>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={match.isWinner ? "default" : "destructive"}>
                      {match.isWinner ? "Won" : "Lost"}
                    </Badge>
                    <span className="font-medium">
                      ${match.wagerAmount.toFixed(2)}{" "}
                      {match.wagerTier.charAt(0).toUpperCase() + match.wagerTier.slice(1)} Match
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(match.completedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${match.isWinner ? "text-green-500" : "text-red-500"}`}>
                    {match.isWinner ? "+" : "-"}${match.wagerAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


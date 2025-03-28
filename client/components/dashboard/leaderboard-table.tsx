import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy } from "lucide-react"

interface LeaderboardEntry {
  id: string
  name: string
  image: string | null
  totalEarnings: number
  winRate: number
}

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[]
}

export default function LeaderboardTable({ leaderboard }: LeaderboardTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((entry, index) => (
            <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  {index === 0 ? (
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <Avatar>
                  <AvatarImage src={entry.image || undefined} />
                  <AvatarFallback>{entry.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.winRate}% win rate</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">${entry.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


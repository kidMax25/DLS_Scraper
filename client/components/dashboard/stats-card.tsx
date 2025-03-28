import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface StatsCardProps {
  stats: {
    totalGames: number
    winRate: number
    topEarnings: number
  }
}

export default function StatsCard({ stats }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Games</p>
            <p className="text-xl font-bold">{stats.totalGames}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-xl font-bold">{stats.winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Top Win</p>
            <p className="text-xl font-bold">${stats.topEarnings}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Loader2, RefreshCw } from "lucide-react"

interface Match {
  id: string
  matchCode: string
  wagerAmount: number
  wagerTier: string
  status: string
  completedAt: string
  isWinner: boolean
  opponentName: string
}

interface MatchHistoryTableProps {
  matches: Match[]
}

export default function MatchHistoryTable({ matches }: MatchHistoryTableProps) {
  const [rematchingId, setRematchingId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleRematch = async (opponentId: string) => {
    setRematchingId(opponentId)

    try {
      const response = await fetch("/api/matches/rematch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ opponentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create rematch")
      }

      toast({
        title: "Rematch Created",
        description: `Your match code is ${data.match.matchCode}`,
      })

      // Refresh to show the match
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create rematch",
        variant: "destructive",
      })
    } finally {
      setRematchingId(null)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        {matches.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No match history available</p>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={match.isWinner ? "default" : "destructive"}>
                      {match.isWinner ? "Won" : "Lost"}
                    </Badge>
                    <span className="font-medium">
                      ${match.wagerAmount.toFixed(2)}{" "}
                      {match.wagerTier.charAt(0).toUpperCase() + match.wagerTier.slice(1)} Match
                    </span>
                  </div>
                  <p className="text-sm">vs. {match.opponentName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(match.completedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right mr-4">
                    <p className={`font-bold ${match.isWinner ? "text-green-500" : "text-red-500"}`}>
                      {match.isWinner ? "+" : "-"}${match.wagerAmount.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRematch(match.opponentName)}
                    disabled={rematchingId === match.opponentName}
                  >
                    {rematchingId === match.opponentName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rematch
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


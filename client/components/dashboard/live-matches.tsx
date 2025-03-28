"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface Match {
  id: string
  matchCode: string
  wagerAmount: number
  wagerTier: string
  createdAt: string
  creator: {
    name: string
    image: string | null
  }
}

interface LiveMatchesProps {
  matches: Match[]
}

export default function LiveMatches({ matches }: LiveMatchesProps) {
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleJoinMatch = async (matchCode: string, matchId: string) => {
    setJoiningId(matchId)

    try {
      const response = await fetch("/api/matches/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join match")
      }

      toast({
        title: "Success",
        description: "You have joined the match",
      })

      // Refresh to show the match
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join match",
        variant: "destructive",
      })
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Matches</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No active matches available</p>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={match.creator.image || undefined} />
                    <AvatarFallback>{match.creator.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{match.creator.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${match.wagerAmount} • {match.wagerTier.charAt(0).toUpperCase() + match.wagerTier.slice(1)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleJoinMatch(match.matchCode, match.id)}
                  disabled={joiningId === match.id}
                >
                  {joiningId === match.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


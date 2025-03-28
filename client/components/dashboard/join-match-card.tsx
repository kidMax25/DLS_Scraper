"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Zap } from "lucide-react"

export default function JoinMatchCard() {
  const [matchCode, setMatchCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [isRandomMatching, setIsRandomMatching] = useState(false)
  const { toast } = useToast()

  const handleJoinMatch = async () => {
    if (!matchCode) {
      toast({
        title: "Error",
        description: "Please enter a match code",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)

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

      // Reset form and refresh
      setMatchCode("")
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join match",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleRandomMatch = async () => {
    setIsRandomMatching(true)

    try {
      const response = await fetch("/api/matches/random", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to find random match")
      }

      toast({
        title: "Success",
        description: data.message || "Random match found",
      })

      // Refresh to show the match
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to find random match",
        variant: "destructive",
      })
    } finally {
      setIsRandomMatching(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Join Match</CardTitle>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input placeholder="Enter match code" value={matchCode} onChange={(e) => setMatchCode(e.target.value)} />
          <Button onClick={handleJoinMatch} disabled={isJoining}>
            {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
          </Button>
        </div>
        <Button variant="outline" className="w-full" onClick={handleRandomMatch} disabled={isRandomMatching}>
          {isRandomMatching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding match...
            </>
          ) : (
            "Random Matchmaking"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}


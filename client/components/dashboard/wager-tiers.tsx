"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

type WagerTier = "mini" | "beast" | "monster"

interface TierInfo {
  name: string
  amount: number
  color: string
}

const tiers: Record<WagerTier, TierInfo> = {
  mini: { name: "Mini", amount: 0.5, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  beast: { name: "Beast", amount: 2, color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  monster: { name: "Monster", amount: 5, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

export default function WagerTiers() {
  const [selectedTier, setSelectedTier] = useState<WagerTier | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const handleCreateMatch = async () => {
    if (!selectedTier) {
      toast({
        title: "Error",
        description: "Please select a wager tier",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wagerTier: selectedTier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create match")
      }

      toast({
        title: "Match Created",
        description: `Your match code is ${data.match.matchCode}`,
      })

      // Reset selection and refresh
      setSelectedTier(null)
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create match",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wager Tiers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {(Object.keys(tiers) as WagerTier[]).map((tier) => (
            <div
              key={tier}
              className={`p-4 rounded-lg cursor-pointer transition-all ${tiers[tier].color} ${
                selectedTier === tier ? "ring-2 ring-primary" : "hover:opacity-90"
              }`}
              onClick={() => setSelectedTier(tier)}
            >
              <div className="font-bold">{tiers[tier].name}</div>
              <div className="text-lg font-bold">${tiers[tier].amount}</div>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={handleCreateMatch} disabled={!selectedTier || isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating match...
            </>
          ) : (
            "Create Match"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}


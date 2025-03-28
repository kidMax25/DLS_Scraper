"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface NotificationSettingsProps {
  notifications: {
    transactionNotifications: boolean
    matchNotifications: boolean
  }
}

export default function NotificationSettings({ notifications }: NotificationSettingsProps) {
  const [transactionUpdates, setTransactionUpdates] = useState(notifications.transactionNotifications)
  const [matchAlerts, setMatchAlerts] = useState(notifications.matchNotifications)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionUpdates,
          matchAlerts,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update notification settings")
      }

      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update notification settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="transaction-updates">Transaction Updates</Label>
              <p className="text-xs text-muted-foreground">Receive notifications about deposits and withdrawals</p>
            </div>
            <Switch id="transaction-updates" checked={transactionUpdates} onCheckedChange={setTransactionUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="match-alerts">Match Alerts</Label>
              <p className="text-xs text-muted-foreground">Receive notifications about match results and invitations</p>
            </div>
            <Switch id="match-alerts" checked={matchAlerts} onCheckedChange={setMatchAlerts} />
          </div>
          <Button onClick={handleSave} disabled={isLoading} className="mt-4">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


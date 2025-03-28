"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface DlsIdSettingsProps {
  dlsId: string | null
}

export default function DlsIdSettings({ dlsId }: DlsIdSettingsProps) {
  const [id, setId] = useState(dlsId || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!id) {
      toast({
        title: "Error",
        description: "Please enter your DLS ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/settings/dls-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dlsId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update DLS ID")
      }

      toast({
        title: "Success",
        description: "DLS ID updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update DLS ID",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>DLS ID Management</CardTitle>
        <CardDescription>Enter your DLS ID to track match results</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="dlsId">DLS ID</Label>
            <Input id="dlsId" placeholder="Enter your DLS ID" value={id} onChange={(e) => setId(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Your DLS ID is used to verify match results from tracker.ftgmes.com
            </p>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save DLS ID"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


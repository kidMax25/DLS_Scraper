"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { BarChart3, Home, History, Settings, LogOut, Trophy } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="hidden md:flex flex-col w-64 border-r bg-background">
      <div className="p-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Trophy className="mr-2 h-6 w-6 text-primary" />
          Wager Platform
        </h2>
      </div>
      <div className="flex-1 px-4 space-y-2">
        <Link href="/dashboard">
          <Button variant={isActive("/dashboard") ? "default" : "ghost"} className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/dashboard/match-history">
          <Button variant={isActive("/dashboard/match-history") ? "default" : "ghost"} className="w-full justify-start">
            <History className="mr-2 h-4 w-4" />
            Match History
          </Button>
        </Link>
        <Link href="/dashboard/stats">
          <Button variant={isActive("/dashboard/stats") ? "default" : "ghost"} className="w-full justify-start">
            <BarChart3 className="mr-2 h-4 w-4" />
            Statistics
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant={isActive("/settings") ? "default" : "ghost"} className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}


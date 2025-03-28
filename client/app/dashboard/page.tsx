import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUserBalance } from "@/lib/binance"
import { getUserStats } from "@/lib/user"
import { getActiveMatches } from "@/lib/matches"
import { getLeaderboard } from "@/lib/leaderboard"
import { getUserMatchHistory } from "@/lib/matches"

import DashboardHeader from "@/components/dashboard/dashboard-header"
import BalanceCard from "@/components/dashboard/balance-card"
import JoinMatchCard from "@/components/dashboard/join-match-card"
import WagerTiers from "@/components/dashboard/wager-tiers"
import StatsCard from "@/components/dashboard/stats-card"
import LiveMatches from "@/components/dashboard/live-matches"
import LeaderboardTable from "@/components/dashboard/leaderboard-table"
import RecentMatches from "@/components/dashboard/recent-matches"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const userId = session.user.id
  const balance = await getUserBalance(userId)
  const stats = await getUserStats(userId)
  const activeMatches = await getActiveMatches()
  const leaderboard = await getLeaderboard()
  const recentMatches = await getUserMatchHistory(userId, 5)

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader user={session.user} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <BalanceCard balance={balance} />
        <JoinMatchCard />
        <StatsCard stats={stats} />
      </div>

      <WagerTiers />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <LiveMatches matches={activeMatches} />
        <LeaderboardTable leaderboard={leaderboard} />
      </div>

      <RecentMatches matches={recentMatches} className="mt-8" />
    </div>
  )
}


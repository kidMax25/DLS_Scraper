import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUserMatchHistory } from "@/lib/matches"
import MatchHistoryTable from "@/components/match-history/match-history-table"
import DashboardHeader from "@/components/dashboard/dashboard-header"

export default async function MatchHistoryPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const userId = session.user.id
  const matches = await getUserMatchHistory(userId)

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader user={session.user} />
      <h1 className="text-2xl font-bold mb-6">Match History</h1>
      <MatchHistoryTable matches={matches} />
    </div>
  )
}


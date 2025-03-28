import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { verifyMatchResult } from "@/lib/match-verification"
import { processBinanceTransaction } from "@/lib/binance"

const resultSchema = z.object({
  winnerId: z.string(),
  dlsMatchId: z.string(),
})

export async function POST(request: Request, { params }: { params: { matchId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const matchId = params.matchId
    const json = await request.json()
    const body = resultSchema.parse(json)

    // Find the match
    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (match.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Match is not in progress" }, { status: 400 })
    }

    // Verify the match result
    const verificationResult = await verifyMatchResult(body.dlsMatchId, match.creatorId, match.joinerId!, body.winnerId)

    if (!verificationResult.verified) {
      // Flag for admin review
      await prisma.match.update({
        where: {
          id: matchId,
        },
        data: {
          status: "DISPUTED",
          disputeReason: verificationResult.reason,
        },
      })

      return NextResponse.json({ error: "Match result could not be verified", disputed: true }, { status: 400 })
    }

    // Process the transaction
    const loserId = body.winnerId === match.creatorId ? match.joinerId : match.creatorId

    // Calculate platform fee (5%)
    const platformFee = match.wagerAmount * 0.05
    const winnerAmount = match.wagerAmount * 2 - platformFee

    // Process transactions
    await processBinanceTransaction(body.winnerId, "CREDIT", winnerAmount)

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: {
        id: matchId,
      },
      data: {
        status: "COMPLETED",
        winnerId: body.winnerId,
        loserId: loserId,
        completedAt: new Date(),
        platformFee,
      },
    })

    // Update user stats
    await prisma.userStats.updateMany({
      where: {
        userId: body.winnerId,
      },
      data: {
        totalWins: { increment: 1 },
        totalEarnings: { increment: match.wagerAmount },
      },
    })

    await prisma.userStats.updateMany({
      where: {
        userId: loserId!,
      },
      data: {
        totalLosses: { increment: 1 },
      },
    })

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error("Error processing match result:", error)
    return NextResponse.json({ error: "Failed to process match result" }, { status: 500 })
  }
}


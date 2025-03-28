import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { processBinanceTransaction } from "@/lib/binance"

const joinMatchSchema = z.object({
  matchCode: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = joinMatchSchema.parse(json)

    const userId = session.user.id

    // Find the match
    const match = await prisma.match.findUnique({
      where: {
        matchCode: body.matchCode,
      },
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (match.status !== "WAITING") {
      return NextResponse.json({ error: "Match is no longer available" }, { status: 400 })
    }

    if (match.creatorId === userId) {
      return NextResponse.json({ error: "You cannot join your own match" }, { status: 400 })
    }

    // Reserve funds from both players
    const creatorReserved = await processBinanceTransaction(match.creatorId, "RESERVE", match.wagerAmount)

    const joinerReserved = await processBinanceTransaction(userId, "RESERVE", match.wagerAmount)

    if (!creatorReserved || !joinerReserved) {
      // If either transaction fails, release any held funds
      if (creatorReserved) {
        await processBinanceTransaction(match.creatorId, "RELEASE", match.wagerAmount)
      }

      if (joinerReserved) {
        await processBinanceTransaction(userId, "RELEASE", match.wagerAmount)
      }

      return NextResponse.json({ error: "Insufficient funds to join match" }, { status: 400 })
    }

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: {
        id: match.id,
      },
      data: {
        joinerId: userId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    })

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error("Error joining match:", error)
    return NextResponse.json({ error: "Failed to join match" }, { status: 500 })
  }
}


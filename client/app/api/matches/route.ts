import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMatchSchema = z.object({
  wagerTier: z.enum(["mini", "beast", "monster"]),
  isRandom: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = createMatchSchema.parse(json)

    const userId = session.user.id

    // Generate a unique match code
    const matchCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Get wager amount based on tier
    const wagerAmounts = {
      mini: 0.5,
      beast: 2,
      monster: 5,
    }

    const wagerAmount = wagerAmounts[body.wagerTier]

    // Create the match
    const match = await prisma.match.create({
      data: {
        matchCode,
        wagerAmount,
        wagerTier: body.wagerTier,
        creatorId: userId,
        status: "WAITING",
        isRandom: body.isRandom || false,
      },
    })

    return NextResponse.json({ match })
  } catch (error) {
    console.error("Error creating match:", error)
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const activeMatches = await prisma.match.findMany({
      where: {
        status: "WAITING",
      },
      include: {
        creator: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    return NextResponse.json({ matches: activeMatches })
  } catch (error) {
    console.error("Error fetching matches:", error)
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
  }
}


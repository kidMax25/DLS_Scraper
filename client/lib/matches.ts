import { prisma } from "@/lib/prisma"

export async function getActiveMatches() {
  try {
    const matches = await prisma.match.findMany({
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

    return matches
  } catch (error) {
    console.error("Error getting active matches:", error)
    return []
  }
}

export async function getUserMatchHistory(userId: string, limit?: number) {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ creatorId: userId }, { joinerId: userId }],
        status: "COMPLETED",
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
        joiner: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
      take: limit || 50,
    })

    // Transform the matches to include whether the user won and the opponent's name
    return matches.map((match) => {
      const isCreator = match.creatorId === userId
      const isWinner = match.winnerId === userId
      const opponentName = isCreator ? match.joiner?.name || "Unknown" : match.creator.name

      return {
        id: match.id,
        matchCode: match.matchCode,
        wagerAmount: match.wagerAmount,
        wagerTier: match.wagerTier,
        status: match.status,
        completedAt: match.completedAt!.toISOString(),
        isWinner,
        opponentName,
      }
    })
  } catch (error) {
    console.error("Error getting user match history:", error)
    return []
  }
}


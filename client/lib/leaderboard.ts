import { prisma } from "@/lib/prisma"

export async function getLeaderboard(limit = 5) {
  try {
    const stats = await prisma.userStats.findMany({
      where: {
        totalGames: {
          gt: 0,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        totalEarnings: "desc",
      },
      take: limit,
    })

    return stats.map((stat) => {
      const winRate = stat.totalGames > 0 ? Math.round((stat.totalWins / stat.totalGames) * 100) : 0

      return {
        id: stat.user.id,
        name: stat.user.name || "Unknown",
        image: stat.user.image,
        totalEarnings: stat.totalEarnings || 0,
        winRate,
      }
    })
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    return []
  }
}


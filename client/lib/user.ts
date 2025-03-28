import { prisma } from "@/lib/prisma"

export async function getUserStats(userId: string) {
  try {
    // Get user's match statistics
    const stats = await prisma.userStats.findUnique({
      where: { userId },
    })

    if (!stats) {
      // Create default stats if none exist
      return {
        totalGames: 0,
        winRate: 0,
        topEarnings: 0,
      }
    }

    // Calculate win rate
    const winRate = stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0

    return {
      totalGames: stats.totalGames,
      winRate,
      topEarnings: stats.topEarnings || 0,
    }
  } catch (error) {
    console.error("Error getting user stats:", error)
    return {
      totalGames: 0,
      winRate: 0,
      topEarnings: 0,
    }
  }
}

export async function getUserSettings(userId: string) {
  try {
    // Get user settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return {
      binanceConnected: user.binanceConnected || false,
      dlsId: user.dlsId,
      notifications: {
        transactionNotifications: user.settings?.transactionNotifications || false,
        matchNotifications: user.settings?.matchNotifications || false,
      },
    }
  } catch (error) {
    console.error("Error getting user settings:", error)
    return {
      binanceConnected: false,
      dlsId: null,
      notifications: {
        transactionNotifications: false,
        matchNotifications: false,
      },
    }
  }
}


import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const notificationsSchema = z.object({
  transactionUpdates: z.boolean(),
  matchAlerts: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = notificationsSchema.parse(json)

    const userId = session.user.id

    // Update user settings
    await prisma.userSettings.upsert({
      where: {
        userId,
      },
      update: {
        transactionNotifications: body.transactionUpdates,
        matchNotifications: body.matchAlerts,
      },
      create: {
        userId,
        transactionNotifications: body.transactionUpdates,
        matchNotifications: body.matchAlerts,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification settings:", error)
    return NextResponse.json({ error: "Failed to update notification settings" }, { status: 500 })
  }
}


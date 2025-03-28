import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const dlsIdSchema = z.object({
  dlsId: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = dlsIdSchema.parse(json)

    const userId = session.user.id

    // Update user settings
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        dlsId: body.dlsId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating DLS ID:", error)
    return NextResponse.json({ error: "Failed to update DLS ID" }, { status: 500 })
  }
}


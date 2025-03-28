import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { verifyBinanceApiCredentials } from "@/lib/binance"

const binanceCredentialsSchema = z.object({
  apiKey: z.string(),
  apiSecret: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = binanceCredentialsSchema.parse(json)

    const userId = session.user.id

    // Verify the API credentials
    const isValid = await verifyBinanceApiCredentials(body.apiKey, body.apiSecret)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Binance API credentials" }, { status: 400 })
    }

    // Update user settings
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        binanceApiKey: body.apiKey,
        binanceApiSecret: body.apiSecret,
        binanceConnected: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error connecting Binance account:", error)
    return NextResponse.json({ error: "Failed to connect Binance account" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Update user settings
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        binanceApiKey: null,
        binanceApiSecret: null,
        binanceConnected: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disconnecting Binance account:", error)
    return NextResponse.json({ error: "Failed to disconnect Binance account" }, { status: 500 })
  }
}


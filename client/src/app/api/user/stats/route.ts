// src/app/api/user/stats/route.ts
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET() {
    try {
        // Get the token from cookies
        const cookieStore = cookies();
        const token = cookieStore.get('access_token');
        
        console.log("Fetching user stats, token exists:", !!token);
        
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Forward the request to the Flask backend (notice we're using /user/stats not /api/user/stats)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/stats`, {
            method: "GET",
            headers: {
                "Cookie": `access_token=${token.value}`,
            },
        });

        if (!res.ok) {
            console.error("Error fetching stats from backend:", res.status);
            return NextResponse.json({ error: "Failed to fetch stats" }, { status: res.status });
        }

        const statsData = await res.json();
        console.log("Stats data fetched successfully");
        
        return NextResponse.json(statsData, { status: 200 });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
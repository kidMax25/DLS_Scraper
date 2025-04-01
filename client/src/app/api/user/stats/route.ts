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

        // Make a simple direct request to Flask backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team-info?team_id=${team_id}`, {
            method: "GET",
            // Don't try to forward cookies or add complex authorization
        });

        if (!response.ok) {
            console.error("Error fetching stats from backend:", response.status);
            return NextResponse.json({ error: "Failed to fetch stats" }, { status: response.status });
        }

        const statsData = await response.json();
        console.log("Stats data fetched successfully");
        
        return NextResponse.json(statsData, { status: 200 });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
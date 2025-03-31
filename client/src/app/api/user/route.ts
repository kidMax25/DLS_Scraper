// src/app/api/user/route.ts
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET() {
    try {
        // Get the token from cookies
        const cookieStore = cookies();
        const token = cookieStore.get('access_token');
        
        console.log("Fetching user data, token exists:", !!token);
        if (token) {
            console.log("Token value (first 20 chars):", token.value.substring(0, 20) + "...");
        }
        
        if (!token) {
            return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 });
        }

        // Forward the request to the Flask backend with the token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/protected`, {
            method: "GET",
            headers: {
                "Cookie": `access_token=${token.value}`
            }
        });

        const responseText = await response.text();
        console.log("Backend response status:", response.status);
        console.log("Backend response headers:", Object.fromEntries([...response.headers.entries()]));
        console.log("Backend response text:", responseText);
        
        let userData;
        try {
            userData = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON response:", e);
            return NextResponse.json({ error: "Invalid response from server" }, { status: 500 });
        }

        if (!response.ok) {
            console.error("Error fetching user from backend:", response.status, userData);
            return NextResponse.json({ error: userData.error || "Unauthorized" }, { status: response.status });
        }

        console.log("User data fetched successfully");
        
        return NextResponse.json(userData, { status: 200 });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }
}
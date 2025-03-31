// src/app/api/auth/route.ts
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        console.log("Login request received for:", data.email);
        
        if (!data.email || !data.password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // Forward the request to the Flask backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(data)
        });

        // Log the response headers for debugging
        console.log("Login response status:", res.status);
        console.log("Login response headers:", Object.fromEntries([...res.headers.entries()]));
        
        // Get the response data
        const responseData = await res.json();
        console.log("Login response data:", responseData);
        
        if (!res.ok) {
            return NextResponse.json(
                { error: responseData.error || "Invalid credentials" }, 
                { status: res.status }
            );
        }

        // Create a NextResponse object
        const response = NextResponse.json(
            { success: true, message: "Login successful" },
            { status: 200 }
        );

        // Extract the cookie from the response
        const setCookieHeader = res.headers.get('set-cookie');
        console.log("Set-Cookie header:", setCookieHeader);
        
        if (setCookieHeader) {
            // Parse the JWT token from the Set-Cookie header
            const match = setCookieHeader.match(/access_token=([^;]+)/);
            const token = match ? match[1] : null;
            
            if (token) {
                // Set the access_token cookie in the response
                response.cookies.set({
                    name: 'access_token',
                    value: token,
                    httpOnly: true,
                    path: '/',
                    sameSite: 'strict',
                    secure: process.env.NODE_ENV !== 'development',
                    maxAge: 60 * 60 * 24 * 7 // 7 days
                });
                
                console.log("Set access_token cookie:", token.substring(0, 20) + "...");
            } else {
                console.error("Failed to extract token from Set-Cookie header");
                return NextResponse.json(
                    { error: "Authentication error" }, 
                    { status: 500 }
                );
            }
        } else {
            console.error("No Set-Cookie header in response");
            return NextResponse.json(
                { error: "Authentication error" }, 
                { status: 500 }
            );
        }

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        // Delete the cookie locally first
        const response = NextResponse.json(
            { success: true, message: "Logged out successfully" },
            { status: 200 }
        );
        
        response.cookies.delete("access_token");
        
        // Then also tell the server to logout (which may clear server-side session)
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
            method: "POST",
            credentials: "include",
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
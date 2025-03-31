import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("access_token");
    
    // List all protected routes that require authentication
    const protectedRoutes = [
        "/dashboard",
        "/funds",
        "/reports",
        "/settings",
        "/debug",
        "/"
    ];
    
    // Check if the current path is protected
    const isProtectedRoute = protectedRoutes.some(route => 
        req.nextUrl.pathname === route || 
        req.nextUrl.pathname.startsWith(`${route}/`)
    );
    
    // Redirect to login if trying to access a protected route without a token
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // If user is already logged in and trying to access login/register pages, redirect to dashboard
    if (token && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
    matcher: [
        // Protected routes that require authentication
        '/dashboard/:path*',
        '/funds/:path*',
        '/reports/:path*',
        '/settings/:path*',
        '/debug/:path*',
        // Auth routes for redirection if already logged in
        '/login',
        '/register'
    ],
};
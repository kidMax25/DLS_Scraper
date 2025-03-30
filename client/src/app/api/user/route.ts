import { NextResponse } from "next/server";

export async function GET() {
    const res = await fetch("http://localhost:5000/protected", {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json(await res.json(), { status: 200 });
}

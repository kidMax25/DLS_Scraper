import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { email, password } = await req.json();

    const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
    });

    if (!res.ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    return NextResponse.json(await res.json(), { status: 200 });
}

export async function DELETE() {
    await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include",
    });

    return NextResponse.json({ message: "Logged out" }, { status: 200 });
}

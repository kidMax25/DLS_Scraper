// src/app/api/register/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['email', 'password', 'full_name', 'team_id'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Forward the request to the Flask backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    // Get the response data
    const responseData = await res.json();
    
    if (!res.ok) {
      console.error('Registration error from backend:', responseData);
      return NextResponse.json(
        { error: responseData.error || 'Registration failed' },
        { status: res.status }
      );
    }
    
    // Pass through the complete response including confirmation status
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
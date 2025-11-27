import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Simple validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Mock user validation
    const mockUser = {
      id: '1',
      email: 'john@example.com',
      name: 'John Doe',
      points: 150
    }

    // Mock login success
    if (email === 'john@example.com' && password === 'password123') {
      return NextResponse.json({
        success: true,
        data: {
          user: mockUser,
          message: 'Login successful!'
        }
      })
    }

    // Mock login failure
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
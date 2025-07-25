import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserById } from '@/utils/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify the JWT token
    const decoded = jwt.verify(authToken, JWT_SECRET) as any;

    // Get user from database to ensure they still exist and are active
    const user = await findUserById(decoded.user_id);

    if (!user || !user.is_active) {
      return NextResponse.json(
        { success: false, message: 'User not found or inactive' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Invalid authentication token' },
      { status: 401 }
    );
  }
} 
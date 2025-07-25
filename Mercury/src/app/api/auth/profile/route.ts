import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserByUsername, updateUser } from '@/utils/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function PUT(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the JWT token
    const decoded = jwt.verify(authToken, JWT_SECRET) as any;
    const { username, email } = await request.json();

    if (!username || !email) {
      return NextResponse.json(
        { success: false, message: 'Username and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await findUserByEmail(decoded.email);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email !== currentUser.email) {
      const existingUserWithEmail = await findUserByEmail(email);
      if (existingUserWithEmail && existingUserWithEmail.user_id !== currentUser.user_id) {
        return NextResponse.json(
          { success: false, message: 'Email is already taken' },
          { status: 409 }
        );
      }
    }

    // Check if username is being changed and if it's already taken
    if (username !== currentUser.username) {
      const existingUserWithUsername = await findUserByUsername(username);
      if (existingUserWithUsername && existingUserWithUsername.user_id !== currentUser.user_id) {
        return NextResponse.json(
          { success: false, message: 'Username is already taken' },
          { status: 409 }
        );
      }
    }

    // Update user profile
    await updateUser(currentUser.user_id, {
      username,
      email,
    });

    // Generate new JWT token with updated information
    const newToken = jwt.sign(
      {
        user_id: currentUser.user_id,
        username,
        email,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set new HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            user_id: currentUser.user_id,
            username,
            email,
          },
        },
      },
      { status: 200 }
    );

    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
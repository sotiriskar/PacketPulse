import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { insertUser, findUserByEmail, findUserByUsername } from '@/utils/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Username, email, and password are required' },
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists in database
    const existingUserByEmail = await findUserByEmail(email);
    const existingUserByUsername = await findUserByUsername(username);

    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    if (existingUserByUsername) {
      return NextResponse.json(
        { success: false, message: 'User with this username already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user object
    const newUser = {
      user_id: uuidv4(),
      username,
      email,
      password_hash: passwordHash,
      is_active: true,
    };

    // Insert user into database
    await insertUser(newUser);

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            user_id: newUser.user_id,
            username: newUser.username,
            email: newUser.email,
          },
        },
      },
      { status: 201 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
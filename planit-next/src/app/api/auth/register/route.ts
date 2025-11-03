import { NextResponse } from 'next/server';
import { User } from '@/models';
import { hashPassword } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, email, password, profession } = await request.json();

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username or email already exists' },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    await User.create({
      username,
      email,
      password: hashedPassword,
      profession,
    });

    return NextResponse.json(
      { message: 'User registered successfully!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Server error during registration' },
      { status: 500 }
    );
  }
}
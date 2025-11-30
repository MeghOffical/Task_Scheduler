import { NextResponse } from 'next/server';
import { User } from '@/models';
import { awardPoints } from '@/lib/points';
import { hashPassword } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { validateEmail } from '@/lib/emailValidator';

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

    // Validate email domain
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { message: emailValidation.error || 'Invalid email domain' },
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
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      profession,
    });

    // Award signup bonus points
    try {
      await awardPoints({
        userId: user._id.toString(),
        type: 'signup_bonus',
        amount: 100,
        description: 'Signup bonus',
      });
    } catch (pointsError) {
      console.error('Error awarding signup bonus points:', pointsError);
      // Do not fail registration if points awarding fails
    }

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
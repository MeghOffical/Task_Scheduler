import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import dbConnect from '@/lib/db';
import { User } from '@/models';

export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authConfig as any);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { newUsername } = await request.json();

    // Validate input
    if (!newUsername || typeof newUsername !== 'string') {
      return NextResponse.json(
        { message: 'New username is required' },
        { status: 400 }
      );
    }

    if (newUsername.trim().length < 3) {
      return NextResponse.json(
        { message: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (newUsername.trim().length > 50) {
      return NextResponse.json(
        { message: 'Username must be less than 50 characters' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if username is already taken
    const existingUser = await User.findOne({ username: newUsername.trim() });
    if (existingUser && existingUser.email !== session.user.email) {
      return NextResponse.json(
        { message: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Update the username
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { username: newUsername.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Username updated successfully',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update username error:', error);
    return NextResponse.json(
      { message: 'Server error while updating username' },
      { status: 500 }
    );
  }
}

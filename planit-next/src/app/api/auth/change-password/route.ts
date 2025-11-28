import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models';
import { hashPassword, comparePasswords } from '@/lib/auth';
import { getAuthenticatedUserId } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.provider === 'google' || !user.password) {
      return NextResponse.json(
        { message: 'Password change is only available for email/password accounts' },
        { status: 400 }
      );
    }

    const isMatch = await comparePasswords(currentPassword, user.password as string);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ message: 'Server error while changing password' }, { status: 500 });
  }
}

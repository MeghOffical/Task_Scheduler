import { NextResponse } from 'next/server';
import { User } from '@/models';
import { hashPassword } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if user is using credentials authentication
    if (user.provider === 'google') {
      return NextResponse.json(
        { message: 'Google OAuth users cannot reset password through this method' },
        { status: 400 }
      );
    }
    
    // Safety check that password exists (required for hashing)
    if (!user.password) {
        return NextResponse.json(
          { message: 'Cannot reset password for an account without a password.' },
          { status: 400 }
        );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset token
    user.password = hashedPassword;
    
    // Clear reset token/expiry; cast user to any so null can be assigned regardless of declared types.
    // This avoids changing the shared model typings here while allowing the fields to be cleared.
    (user as any).resetPasswordToken = null;
    (user as any).resetPasswordExpires = null;
    
    await user.save();

    return NextResponse.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
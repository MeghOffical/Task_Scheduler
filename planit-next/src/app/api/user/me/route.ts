import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { User } from '@/models';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyToken(token);
    if ('error' in verified || !verified.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get full user info from database
    const user = await User.findById(verified.id).select('username email profession');
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      profession: user.profession,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { message: 'Error fetching user info' },
      { status: 500 }
    );
  }
}


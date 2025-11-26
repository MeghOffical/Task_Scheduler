import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { User } from '@/models';
import dbConnect from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

  // Get full user info from database, including points and daily check-in timestamp
  const user = await User.findById(userId).select('username email profession points lastDailyCheckinAt');
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  profession: user.profession,
  points: user.points ?? 0,
  lastDailyCheckinAt: user.lastDailyCheckinAt,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { message: 'Error fetching user info' },
      { status: 500 }
    );
  }
}


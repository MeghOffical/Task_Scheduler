import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { User } from '@/models';
import { awardPoints, hasClaimedDailyCheckinToday } from '@/lib/points';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId).select('lastDailyCheckinAt');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (hasClaimedDailyCheckinToday(user.lastDailyCheckinAt)) {
      return NextResponse.json(
        { message: 'Daily check-in already claimed for today' },
        { status: 400 }
      );
    }

    const newBalance = await awardPoints({
      userId: userId.toString(),
      type: 'daily_checkin',
      amount: 1,
      description: 'Daily check-in',
    });

    return NextResponse.json({
      message: 'Daily check-in successful',
      points: newBalance,
    });
  } catch (error) {
    console.error('Daily check-in error:', error);
    return NextResponse.json(
      { message: 'Error during daily check-in' },
      { status: 500 }
    );
  }
}

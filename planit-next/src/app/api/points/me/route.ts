import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { getUserPointsAndActivity } from '@/lib/points';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { points, activities } = await getUserPointsAndActivity(userId);

    return NextResponse.json({
      points,
      activities,
    });
  } catch (error) {
    console.error('Error fetching points data:', error);
    return NextResponse.json(
      { message: 'Error fetching points data' },
      { status: 500 }
    );
  }
}

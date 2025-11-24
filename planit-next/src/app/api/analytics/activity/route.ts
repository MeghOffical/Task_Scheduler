import { NextResponse } from 'next/server';
import { TaskCompletionHistory } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all completion history for the user
    // This persists even if tasks are deleted
    const completionHistory = await TaskCompletionHistory.find({
      userId
    }).select('completedAt');

    // Calculate activity for the past year
    const activityMap: { [date: string]: number } = {};
    
    completionHistory.forEach((record) => {
      if (record.completedAt) {
        const dateStr = record.completedAt.toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      }
    });

    return NextResponse.json({ activity: activityMap });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}

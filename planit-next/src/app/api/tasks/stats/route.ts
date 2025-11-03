import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Task } from '@/models';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function GET(request: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyToken(token);
    if ('error' in verified) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const stats = await Task.aggregate([
      { $match: { userId: verified.id } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
          },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          overdueTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] },
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] },
          },
          mediumPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] },
          },
          lowPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] },
          },
        },
      },
    ]);

    const defaultStats = {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    };

    return NextResponse.json(stats[0] || defaultStats);
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { message: 'Error fetching task stats' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Task } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Support both regular auth and internal tool calls
    const internalUserId = request.headers.get('x-user-id');
    const userIdString = internalUserId || await getAuthenticatedUserId();
    
    if (!userIdString) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Convert userId string to ObjectId for proper matching
    const userId = new mongoose.Types.ObjectId(userIdString);
    
    // Fetch all tasks for the user
    const tasks = await Task.find({ userId }).lean();

    // Calculate statistics
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const stats = {
      totalTasks: tasks.length,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    };

    tasks.forEach((task) => {
      // Count by status
      if (task.status === 'pending') stats.pendingTasks++;
      else if (task.status === 'in-progress') stats.inProgressTasks++;
      else if (task.status === 'completed') stats.completedTasks++;

      // Count overdue tasks (dueDate < today AND status !== 'completed')
      if (task.dueDate && task.status !== 'completed') {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < now) {
          stats.overdueTasks++;
        }
      }

      // Count by priority
      if (task.priority === 'high') stats.highPriority++;
      else if (task.priority === 'medium') stats.mediumPriority++;
      else if (task.priority === 'low') stats.lowPriority++;
    });

    console.log('Stats calculated:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { message: 'Error fetching task stats' },
      { status: 500 }
    );
  }
}
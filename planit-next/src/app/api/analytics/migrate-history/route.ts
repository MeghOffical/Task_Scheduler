import { NextResponse } from 'next/server';
import { Task, TaskCompletionHistory } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';

/**
 * Migration endpoint to populate TaskCompletionHistory from existing completed tasks
 * This should be called once to migrate existing data
 */
export async function POST() {
  try {
    await dbConnect();
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all completed tasks for the user
    const completedTasks = await Task.find({
      userId,
      status: 'completed',
      completedAt: { $ne: null }
    }).select('_id title completedAt');

    let migratedCount = 0;
    let skippedCount = 0;

    // Migrate each completed task to completion history
    for (const task of completedTasks) {
      try {
        await TaskCompletionHistory.findOneAndUpdate(
          { userId, taskId: task._id },
          { 
            userId, 
            taskId: task._id,
            completedAt: task.completedAt,
            taskTitle: task.title
          },
          { upsert: true, new: true }
        );
        migratedCount++;
      } catch (error) {
        // Skip if already exists (duplicate key error)
        skippedCount++;
      }
    }

    return NextResponse.json({ 
      message: 'Migration completed',
      migratedCount,
      skippedCount,
      totalProcessed: completedTasks.length
    });
  } catch (error) {
    console.error('Error migrating completion history:', error);
    return NextResponse.json(
      { error: 'Failed to migrate completion history' },
      { status: 500 }
    );
  }
}

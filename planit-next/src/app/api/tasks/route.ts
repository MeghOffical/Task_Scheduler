import { NextResponse } from 'next/server';
import { Task } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';
import { awardPoints } from '@/lib/points';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Support both regular auth and internal tool calls
    const internalUserId = request.headers.get('x-user-id');
    const userId = internalUserId || await getAuthenticatedUserId();
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check and update overdue tasks before fetching
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all tasks that are past due but not completed or already overdue
    const overdueTasks = await Task.find({
      userId,
      dueDate: { $lt: today },
      status: { $nin: ['completed', 'overdue'] }
    });

    // Update each overdue task and deduct points
    for (const task of overdueTasks) {
      await Task.findByIdAndUpdate(task._id, { status: 'overdue' });
      
      // Deduct 5 coins for missing deadline
      try {
        await awardPoints({
          userId: userId.toString(),
          type: 'task_overdue',
          amount: -5,
          description: `Missed deadline: ${task.title}`,
        });
      } catch (e) {
        console.error('Error applying missed deadline penalty:', e);
      }
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const filter: any = { userId };
    
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    
    // Transform the MongoDB _id to id before sending
    const transformedTasks: any[] = [];
    for (const task of tasks) {
      transformedTasks.push({
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        startTime: task.startTime || null,
        endTime: task.endTime || null,
        createdAt: task.createdAt,
        userId: task.userId
      });
    }

    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { message: 'Error fetching tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, status, dueDate, startTime, endTime } = body;

    if (!title) {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const task = await Task.create({
      userId,
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      startTime: startTime || null,
      endTime: endTime || null,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { message: 'Error creating task' },
      { status: 500 }
    );
  }
}
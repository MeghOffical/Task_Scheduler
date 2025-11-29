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
    const now = new Date();
    
    // Find all tasks that are not completed or already overdue
    const potentiallyOverdueTasks = await Task.find({
      userId,
      status: { $nin: ['completed', 'overdue'] }
    });

    // Check each task to see if it's overdue based on date and time
    for (const task of potentiallyOverdueTasks) {
      let isOverdue = false;
      
      if (task.dueDate) {
        // Create date in local timezone
        const dueDate = new Date(task.dueDate);
        
        if (task.endTime) {
          // Parse endTime (format: "HH:mm") and combine with dueDate
          const [hours, minutes] = task.endTime.split(':').map(Number);
          const dueDateTime = new Date(dueDate);
          dueDateTime.setHours(hours, minutes, 0, 0);
          
          console.log(`[OVERDUE CHECK] Task: ${task.title}, Now: ${now.toISOString()}, Due: ${dueDateTime.toISOString()}, IsOverdue: ${now > dueDateTime}`);
          
          // Task is overdue if current time is past the due date + end time
          isOverdue = now > dueDateTime;
        } else {
          // No end time specified, consider overdue after the due date (at midnight)
          const dueDateMidnight = new Date(dueDate);
          dueDateMidnight.setHours(23, 59, 59, 999);
          
          console.log(`[OVERDUE CHECK] Task: ${task.title} (no end time), Now: ${now.toISOString()}, Due: ${dueDateMidnight.toISOString()}, IsOverdue: ${now > dueDateMidnight}`);
          
          isOverdue = now > dueDateMidnight;
        }
      }
      
      if (isOverdue) {
        console.log(`[MARKING OVERDUE] Task: ${task.title} - Deducting 5 coins`);
        await Task.findByIdAndUpdate(task._id, { status: 'overdue' });
        
        // Deduct 5 coins for missing deadline
        try {
          await awardPoints({
            userId: userId.toString(),
            type: 'missed_deadline',
            amount: -5,
            description: `Missed deadline: ${task.title}`,
          });
        } catch (e) {
          console.error('Error applying missed deadline penalty:', e);
        }
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
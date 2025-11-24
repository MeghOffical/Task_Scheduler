import { NextResponse } from 'next/server';
import { Task, TaskCompletionHistory } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Ensure the task exists and belongs to the user
    const task = await Task.findOne({
      _id: new ObjectId(params.id),
      userId
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the task
    await Task.deleteOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { message: 'Error deleting task' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, status, dueDate, startTime, endTime } = body;

    await dbConnect();

    // Ensure the task exists and belongs to the user
    const task = await Task.findOne({
      _id: new ObjectId(params.id),
      userId
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      startTime: startTime || null,
      endTime: endTime || null,
    };

    // Set completedAt when task is marked as completed
    if (status === 'completed' && task.status !== 'completed') {
      updateData.completedAt = new Date();
      
      // Record completion in history for persistent tracking
      await TaskCompletionHistory.findOneAndUpdate(
        { userId, taskId: task._id },
        { 
          userId, 
          taskId: task._id,
          completedAt: updateData.completedAt,
          taskTitle: title || task.title
        },
        { upsert: true, new: true }
      );
    } else if (status !== 'completed' && task.completedAt) {
      updateData.completedAt = null;
      
      // Remove from completion history if unmarked as completed
      await TaskCompletionHistory.deleteOne({
        userId,
        taskId: task._id
      });
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { message: 'Error updating task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    await dbConnect();

    // Ensure the task exists and belongs to the user
    const task = await Task.findOne({
      _id: new ObjectId(params.id),
      userId
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    // If status is being changed to completed, set completedAt
    const updateData = { ...body };
    if (body.status === 'completed' && task.status !== 'completed') {
      updateData.completedAt = new Date();
      
      // Record completion in history for persistent tracking
      await TaskCompletionHistory.findOneAndUpdate(
        { userId, taskId: task._id },
        { 
          userId, 
          taskId: task._id,
          completedAt: updateData.completedAt,
          taskTitle: body.title || task.title
        },
        { upsert: true, new: true }
      );
    } else if (body.status && body.status !== 'completed' && task.completedAt) {
      updateData.completedAt = null;
      
      // Remove from completion history if unmarked as completed
      await TaskCompletionHistory.deleteOne({
        userId,
        taskId: task._id
      });
    }

    // Update only the provided fields
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { message: 'Error updating task' },
      { status: 500 }
    );
  }
}
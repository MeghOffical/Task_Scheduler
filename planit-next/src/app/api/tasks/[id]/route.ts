import { NextResponse } from 'next/server';
import { Task } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';
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

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      {
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        startTime: startTime || null,
        endTime: endTime || null,
      },
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

    // Update only the provided fields
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      { $set: body },
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
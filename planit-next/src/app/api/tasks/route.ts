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

    const tasks = await Task.find({ userId: verified.id }).sort({ createdAt: -1 });

    return NextResponse.json(tasks);
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
    const token = cookies().get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyToken(token);
    if ('error' in verified || !verified.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, status, dueDate } = body;

    if (!title) {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const task = await Task.create({
      userId: verified.id,
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
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
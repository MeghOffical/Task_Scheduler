import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import dbConnect from '@/lib/db';
import { User } from '@/models';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user?.email });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      pomodoroSettings: user.pomodoroSettings || {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { pomodoroSettings, username } = body;

    if (!pomodoroSettings && !username) {
      return new Response(JSON.stringify({ error: 'No valid settings provided for update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If username is being updated, check if it's already taken
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser.email !== session.user?.email) {
        return new Response(JSON.stringify({ error: 'Username already taken' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    await dbConnect();
    const updateData: any = {};
    if (pomodoroSettings) updateData.pomodoroSettings = pomodoroSettings;
    if (username) updateData.username = username;

    const user = await User.findOneAndUpdate(
      { email: session.user?.email },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      pomodoroSettings: user.pomodoroSettings,
      username: user.username
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
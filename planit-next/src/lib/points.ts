import dbConnect from '@/lib/db';
import { User, PointActivity } from '@/models';

export type PointActivityType =
  | 'signup_bonus'
  | 'daily_checkin'
  | 'task_completed_on_time'
  | 'missed_deadline';

interface AwardPointsOptions {
  userId: string;
  type: PointActivityType;
  amount: number; // positive for rewards, negative for penalties
  description: string;
}

/**
 * Atomically updates the user's points balance and records a PointActivity.
 */
export async function awardPoints({ userId, type, amount, description }: AwardPointsOptions) {
  await dbConnect();

  // Update user points and optionally lastDailyCheckinAt in a single operation
  const update: any = {
    $inc: { points: amount },
  };

  if (type === 'daily_checkin') {
    update.$set = { lastDailyCheckinAt: new Date() };
  }

  const user = await User.findByIdAndUpdate(
    userId,
    update,
    { new: true }
  );

  if (!user) {
    throw new Error('User not found when awarding points');
  }

  // Prevent negative points; clamp to zero if it somehow goes below
  if (user.points < 0) {
    user.points = 0;
    await user.save();
  }

  await PointActivity.create({
    userId,
    type,
    amount,
    description,
  });

  return user.points;
}

/**
 * Checks if the user has already claimed the daily check-in for today.
 */
export function hasClaimedDailyCheckinToday(lastDailyCheckinAt: Date | null | undefined) {
  if (!lastDailyCheckinAt) return false;

  const last = new Date(lastDailyCheckinAt);
  const now = new Date();

  const lastY = last.getFullYear();
  const lastM = last.getMonth();
  const lastD = last.getDate();

  const nowY = now.getFullYear();
  const nowM = now.getMonth();
  const nowD = now.getDate();

  return lastY === nowY && lastM === nowM && lastD === nowD;
}

/**
 * Fetch current points and recent activity for the given user.
 */
export async function getUserPointsAndActivity(userId: string, limit = 50) {
  await dbConnect();

  const user = await User.findById(userId).select('points');
  if (!user) {
    throw new Error('User not found when fetching points');
  }

  const activities = await PointActivity.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    points: user.points ?? 0,
    activities,
  };
}

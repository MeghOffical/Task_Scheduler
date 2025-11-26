'use client';

import { useEffect, useState } from 'react';

interface PointActivityItem {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function PointsPage() {
  const [points, setPoints] = useState<number | null>(null);
  const [activities, setActivities] = useState<PointActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckinToast, setShowCheckinToast] = useState(false);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await fetch('/api/points/me');
        if (!res.ok) {
          throw new Error('Failed to load points data');
        }
        const data = await res.json();
        setPoints(data.points ?? 0);
        const acts: PointActivityItem[] = data.activities || [];
        setActivities(acts);

        // If this load includes a fresh Daily check-in entry and we haven't
        // shown the popup yet in this session, show a temporary toast.
        const hasDailyCheckin = acts.some(
          (a) => a.description === 'Daily check-in'
        );
        if (hasDailyCheckin && !sessionStorage.getItem('dailyCheckinToastShown')) {
          setShowCheckinToast(true);
          sessionStorage.setItem('dailyCheckinToastShown', 'true');
          setTimeout(() => setShowCheckinToast(false), 3500);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading points');
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
  <div className="max-w-3xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Your Point Activity
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            See how you earn and lose points across your tasks and daily check-ins.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.16em] text-amber-300/80 font-medium">
              Your Points
            </span>
            <span className="text-xl font-bold text-amber-300">
              {points ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {showCheckinToast && (
        <div className="fixed bottom-8 right-8 z-50 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 shadow-lg flex items-center gap-3 text-sm text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          <div>
            <p className="font-semibold">Daily check-in successful</p>
            <p className="text-xs text-emerald-200/80">You earned +1 point for today.</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200/60 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-[#0B0E12] dark:text-slate-400">
          Loading points...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-xl border border-slate-200/60 bg-white dark:border-white/10 dark:bg-[#0B0E12] overflow-hidden">
          <div className="border-b border-slate-200/70 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-[#05070B] dark:text-slate-400">
            Recent Activity
          </div>

          {activities.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No point activity yet. Complete tasks and check in daily to earn points.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200/70 dark:divide-white/10">
              {activities.map((item) => (
                <li key={item._id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {item.description}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="text-sm font-semibold">
                    <span className={item.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {item.amount >= 0 ? '+' : ''}{item.amount}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

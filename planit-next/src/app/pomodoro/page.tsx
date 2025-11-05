'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';
import DashboardLayout from '@/components/dashboard-layout';

interface PomodoroSession {
  id: number;
  date: string;
  type: 'focus' | 'break';
  duration: number;
  taskId?: string;
  taskTitle: string;
}

export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<PomodoroSession[]>([]);
  
  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  const timerRef = useRef<NodeJS.Timeout>();

  // Audio Context
  const audioContextRef = useRef<AudioContext>();

  useEffect(() => {
    // Initialize Audio Context
    audioContextRef.current = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)();
    
    // Fetch tasks
    fetchTasks();
    
    // Load history from localStorage
    const savedHistory = localStorage.getItem('pomodoroHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const playNotificationSound = () => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.3);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(isBreak ? BREAK_TIME : FOCUS_TIME);
  };

  const skipSession = () => {
    if (confirm('Skip this session?')) {
      pauseTimer();
      switchSession();
    }
  };

  const completeSession = () => {
    pauseTimer();
    playNotificationSound();

    // Save to history
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const newSession: PomodoroSession = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: isBreak ? 'break' : 'focus',
      duration: isBreak ? BREAK_TIME / 60 : FOCUS_TIME / 60,
      taskId: selectedTaskId || undefined,
      taskTitle: selectedTask ? selectedTask.title : 'No task linked'
    };

    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('pomodoroHistory', JSON.stringify(updatedHistory));

    alert(isBreak ? 'Break complete! Time to focus.' : 'Focus session complete! Take a break.');
    switchSession();
  };

  const switchSession = () => {
    setIsBreak(!isBreak);
    setTimeLeft(isBreak ? FOCUS_TIME : BREAK_TIME);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-1 gap-6 p-6 overflow-hidden">
        <section className="flex-1 bg-[#1B2537] rounded-lg shadow-md p-8 flex flex-col text-white">
        <h1 className="text-2xl font-bold mb-6">Pomodoro Timer</h1>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-lg text-white mb-5">
            {isBreak ? 'Break Time' : 'Focus Session'}
          </div>
          
          {(() => {
            const totalSeconds = isBreak ? BREAK_TIME : FOCUS_TIME;
            const progress = Math.max(0, Math.min(1, timeLeft / totalSeconds));
            const radius = 88; // visual radius
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);
            const ringColor = isBreak ? '#10B981' /* emerald-500 */ : '#0891B2' /* cyan-600 */;
            const trackColor = '#1F2937'; /* gray-800 to match dark card */
            return (
              <div className="mb-6">
                <svg width="224" height="224" viewBox="0 0 224 224" className="block">
                  <circle
                    cx="112"
                    cy="112"
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={12}
                  />
                  <circle
                    cx="112"
                    cy="112"
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={12}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 112 112)" /* start from top */
                  />
                  <foreignObject x="0" y="0" width="224" height="224">
                    <div className="w-[224px] h-[224px] flex items-center justify-center">
                      <div className={`text-4xl font-bold ${isBreak ? 'text-emerald-500' : 'text-cyan-600'}`}>
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </foreignObject>
                </svg>
              </div>
            );
          })()}

          <div className="flex gap-3 mb-6">
            <button
              onClick={toggleTimer}
              className="px-6 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
            >
              Reset
            </button>
            <button
              onClick={skipSession}
              className="px-6 py-2 rounded-lg bg-amber-100 text-amber-600 font-semibold hover:bg-amber-200"
            >
              Skip
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="taskSelect" className="block text-sm font-semibold text-white mb-2">
            Link to Task (optional)
          </label>
          <select
            id="taskSelect"
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="w-full p-2 border border-gray-600 rounded-lg bg-[#111827] text-white"
          >
            <option value="">No task selected</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="w-80 bg-[#1B2537] rounded-lg shadow-md p-6 flex flex-col text-white">
        <h2 className="text-xl font-bold mb-4 text-white">Session History</h2>
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center text-white py-8">
              No sessions completed yet
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg bg-[#111827] border-l-4 ${
                    session.type === 'break' ? 'border-emerald-500' : 'border-cyan-600'
                  }`}
                >
                  <div className="text-xs text-cyan-600 mb-1">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="font-semibold text-sm mb-1">{session.taskTitle}</div>
                  <div className={`text-sm ${
                    session.type === 'break' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {session.duration} min {session.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      </div>
    </DashboardLayout>
  );
}
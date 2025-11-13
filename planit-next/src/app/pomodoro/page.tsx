'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';

declare global {
  interface Window {
    postMessage(message: any, targetOrigin?: string): void;
  }
}

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

interface PomodoroSession {
  id: number;
  date: string;
  type: 'focus' | 'break';
  duration: number;
  taskId?: string;
  taskTitle: string;
}

export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<PomodoroSession[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4
  });
  
  const timerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext>();

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    fetchTasks();
    fetchSettings();
    
    const savedHistory = localStorage.getItem('pomodoroHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const handleSettingsChange = (event: CustomEvent<PomodoroSettings>) => {
      setSettings(event.detail);
      if (!isRunning) {
        setTimeLeft(event.detail.workDuration * 60);
      }
    };

    window.addEventListener('pomodoroSettingsChanged', handleSettingsChange as EventListener);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.removeEventListener('pomodoroSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  useEffect(() => {
    try {
      window.postMessage(
        {
          source: 'planit-pomodoro',
          state: isBreak ? 'break' : (isRunning ? 'focus' : 'paused')
        },
        '*'
      );
    } catch (e) {
      console.warn('postMessage failed', e);
    }
  }, [isBreak, isRunning]);
  
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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.pomodoroSettings) {
          setSettings(data.pomodoroSettings);
          if (!isRunning) {
            setTimeLeft(data.pomodoroSettings.workDuration * 60);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
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
    const newTime = isBreak
      ? (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60
      : settings.workDuration * 60;
    setTimeLeft(newTime);
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
    const sessionDuration = isBreak
      ? (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration)
      : settings.workDuration;

    const newSession: PomodoroSession = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: isBreak ? 'break' : 'focus',
      duration: sessionDuration,
      taskId: selectedTaskId || undefined,
      taskTitle: selectedTask ? selectedTask.title : 'No task linked'
    };

    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('pomodoroHistory', JSON.stringify(updatedHistory));

    if (!isBreak) {
      // Only increment session count after focus sessions
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      // Check if it's time for a long break
      if (newSessionCount % settings.longBreakInterval === 0) {
        setIsLongBreak(true);
      }
    }

    alert(isBreak ? 'Break complete! Time to focus.' : 'Focus session complete! Take a break.');
    switchSession();
  };

  const switchSession = () => {
    const wasBreak = isBreak;
    setIsBreak(!wasBreak);
    
    if (wasBreak) {
      // Switching to focus mode
      setIsLongBreak(false);
      setTimeLeft(settings.workDuration * 60);
    } else {
      // Switching to break mode
      const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
      setTimeLeft(breakDuration * 60);
    }
  };

  const getTimerColor = () => {
    if (isBreak) {
      return isLongBreak ? '#059669' /* emerald-600 */ : '#10B981' /* emerald-500 */;
    }
    return '#0891B2' /* cyan-600 */;
  };

  return (
    <div className="flex flex-1 gap-6 p-6 overflow-hidden">
      <section className="flex-1 bg-[#1B2537] rounded-lg shadow-md p-8 flex flex-col text-white">
        <h1 className="text-2xl font-bold mb-6">Pomodoro Timer</h1>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-lg text-white mb-5">
            {isBreak ? (isLongBreak ? 'Long Break' : 'Short Break') : 'Focus Session'}
          </div>
          
          {(() => {
            const totalSeconds = isBreak
              ? (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60
              : settings.workDuration * 60;
            const progress = Math.max(0, Math.min(1, timeLeft / totalSeconds));
            const radius = 88;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);
            const ringColor = getTimerColor();
            const trackColor = '#1F2937';
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
                    transform="rotate(-90 112 112)"
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
          
          <div className="text-sm text-gray-400 mb-6">
            Session {sessionCount % settings.longBreakInterval || settings.longBreakInterval} of {settings.longBreakInterval}
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
  );
}

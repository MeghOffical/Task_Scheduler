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
    <div className="flex flex-1 gap-6 p-8 overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Main Timer Section */}
      <section className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 flex flex-col text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
        <div className="mb-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400">Pomodoro Timer</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Stay focused and productive with the Pomodoro technique</p>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          {/* Session Type Badge */}
          <div className={`px-6 py-2 rounded-full font-semibold text-lg mb-8 ${
            isBreak 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
              : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
          }`}>
            {isBreak ? (isLongBreak ? '☕ Long Break' : '🌿 Short Break') : '🎯 Focus Session'}
          </div>
          
          {/* Timer Circle with Progress */}
          {(() => {
            const totalSeconds = isBreak
              ? (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60
              : settings.workDuration * 60;
            const progress = Math.max(0, Math.min(1, timeLeft / totalSeconds));
            const radius = 100;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);
            const ringColor = getTimerColor();
            const trackColor = '#E5E7EB';
            return (
              <div className="mb-12 relative">
                <svg width="280" height="280" viewBox="0 0 280 280" className="drop-shadow-lg">
                  {/* Background circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={8}
                  />
                  {/* Progress circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={8}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 140 140)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                  <foreignObject x="0" y="0" width="280" height="280">
                    <div className="w-[280px] h-[280px] flex items-center justify-center">
                      <div className={`text-6xl font-bold font-mono tracking-tighter ${isBreak ? 'text-emerald-500' : 'text-cyan-600'}`}>
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </foreignObject>
                </svg>
              </div>
            );
          })()}

          {/* Control Buttons */}
          <div className="flex gap-4 mb-8 flex-wrap justify-center">
            <button
              onClick={toggleTimer}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white'
              }`}
            >
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button
              onClick={resetTimer}
              className="px-8 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 shadow-lg"
            >
              🔄 Reset
            </button>
            <button
              onClick={skipSession}
              className="px-8 py-3 rounded-lg bg-amber-400 hover:bg-amber-500 text-white font-semibold transition-all duration-200 shadow-lg"
            >
              ⏭ Skip
            </button>
          </div>
          
          {/* Session Counter */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">Session Progress</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {sessionCount % settings.longBreakInterval || settings.longBreakInterval} / {settings.longBreakInterval}
            </p>
          </div>
        </div>

        {/* Task Selection */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <label htmlFor="taskSelect" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            📋 Link to Task (optional)
          </label>
          <select
            id="taskSelect"
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none transition-colors"
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

      {/* Session History Sidebar */}
      <section className="w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">📊 Session History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Recent Pomodoro sessions</p>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-3">🌱</div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No sessions yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Complete your first Pomodoro session to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                    session.type === 'break' 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' 
                      : 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      session.type === 'break'
                        ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200'
                        : 'bg-cyan-200 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200'
                    }`}>
                      {session.type === 'break' ? '☕ Break' : '🎯 Focus'}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1 truncate">
                    {session.taskTitle || 'No task'}
                  </p>
                  <p className={`text-sm font-medium ${
                    session.type === 'break' ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-600 dark:text-cyan-400'
                  }`}>
                    ⏱ {session.duration} minutes
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
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
          <label htmlFor="taskSelect" className="block text-sm font-semibold text-gray-700 dark:text-gray-100 mb-2">
            Link to Task (optional)
          </label>
          <select
            id="taskSelect"
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
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

      <section className="w-80 bg-[#E8F4F8] rounded-lg shadow-md p-6 flex flex-col text-gray-900 dark:text-white">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Session History</h2>
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-white py-8">
              No sessions completed yet
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg bg-gray-100 dark:bg-[#111827] border-l-4 ${
                    session.type === 'break' ? 'border-emerald-500' : 'border-cyan-600'
                  }`}
                >
                  <div className="text-xs text-cyan-600 dark:text-cyan-400 mb-1">
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

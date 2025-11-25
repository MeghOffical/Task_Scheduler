'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  type: 'focus' | 'short_break' | 'long_break';
  duration: number; // minutes
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
  const [showInstructions, setShowInstructions] = useState(false);
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4
  });

  const timerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext>();
  const isRunningRef = useRef(isRunning);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.pomodoroSettings) {
          setSettings(data.pomodoroSettings);
          if (!isRunningRef.current) {
            setTimeLeft(data.pomodoroSettings.workDuration * 60);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    fetchTasks();
    fetchSettings();

    const savedHistory = localStorage.getItem('pomodoroHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // migrate legacy 'break' entries to 'short_break'
        const migrated = Array.isArray(parsed)
          ? parsed.map((s: any) => s.type === 'break' ? { ...s, type: 'short_break' } : s)
          : [];
        setHistory(migrated);
      } catch (e) {
        console.warn('Failed to parse pomodoroHistory', e);
      }
    }

    const handleSettingsChange = (event: CustomEvent<PomodoroSettings>) => {
      setSettings(event.detail);
      if (!isRunningRef.current) {
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
  }, [fetchSettings, fetchTasks]);

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

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

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

  const completeSession = () => {
    pauseTimer();
    playNotificationSound();

    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const sessionDuration = isBreak
      ? (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration)
      : settings.workDuration;

    const newSession: PomodoroSession = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: isBreak ? (isLongBreak ? 'long_break' : 'short_break') : 'focus',
      duration: sessionDuration,
      taskId: selectedTaskId || undefined,
      taskTitle: selectedTask ? selectedTask.title : 'No task linked'
    };

    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('pomodoroHistory', JSON.stringify(updatedHistory));

    if (!isBreak) {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      if (newSessionCount % settings.longBreakInterval === 0) {
        setIsLongBreak(true);
      }
    }

  alert(isBreak ? 'Break complete! Time to focus.' : (isLongBreak ? 'Great! Long break complete.' : 'Focus session complete! Take a break.'));
    switchSession();
  };

  const switchSession = () => {
    const wasBreak = isBreak;
    setIsBreak(!wasBreak);

    if (wasBreak) {
      setIsLongBreak(false);
      setTimeLeft(settings.workDuration * 60);
    } else {
      const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
      setTimeLeft(breakDuration * 60);
    }
  };

  // Explicit mode switching via top tabs: Pomodoro / Short Break / Long Break
  const selectPomodoro = () => {
    pauseTimer();
    setIsBreak(false);
    setIsLongBreak(false);
    setTimeLeft(settings.workDuration * 60);
  };

  const selectShortBreak = () => {
    pauseTimer();
    setIsBreak(true);
    setIsLongBreak(false);
    setTimeLeft(settings.shortBreakDuration * 60);
  };

  const selectLongBreak = () => {
    pauseTimer();
    setIsBreak(true);
    setIsLongBreak(true);
    setTimeLeft(settings.longBreakDuration * 60);
  };

  const getTimerColor = () => {
    if (isBreak) {
      return isLongBreak ? '#059669' : '#10B981';
    }
    return '#0891B2';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-6 lg:p-8 overflow-hidden">
      
      <section className="flex-1 glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-12 flex flex-col text-gray-900 dark:text-white">
        
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">Pomodoro Timer</h1>

        {/* MODE TABS: Pomodoro / Short Break / Long Break */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-6 mb-6 sm:mb-10 overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 bg-sky-900/60 rounded-2xl sm:rounded-3xl px-2 sm:px-6 lg:px-8 py-2 sm:py-3 text-white shadow-lg whitespace-nowrap">
          <button
            onClick={selectPomodoro}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm ${
              !isBreak ? 'bg-sky-500' : 'bg-transparent'
            }`}
          >
            Pomodoro
          </button>
          <button
            onClick={selectShortBreak}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm ${
              isBreak && !isLongBreak ? 'bg-sky-500' : 'bg-transparent'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={selectLongBreak}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm ${
              isBreak && isLongBreak ? 'bg-sky-500' : 'bg-transparent'
            }`}
          >
            Long Break
          </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6 lg:gap-8 py-4 sm:py-6">

          <div className="text-sm sm:text-lg lg:text-xl font-light tracking-wide text-gray-500 dark:text-gray-300">
            {isBreak ? (isLongBreak ? 'Long Break' : 'Short Break') : 'Focus Session'}
          </div>

          {(() => {
            const totalSeconds = isBreak
              ? (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60
              : settings.workDuration * 60;
            const progress = Math.max(0, Math.min(1, timeLeft / totalSeconds));
            const radius = 115;
            const strokeWidth = 10;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);
            const trackColor = "#E5E7EB";

            return (
              <div className="relative shadow-lg sm:shadow-xl lg:shadow-2xl shadow-cyan-500/40 lg:shadow-cyan-500/50 rounded-full">
                <svg width="320" height="320" viewBox="0 0 320 320" className="block drop-shadow-md sm:drop-shadow-lg w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80">
                  <defs>
                    <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="1" />
                      <stop offset="50%" stopColor="#0891B2" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0E7490" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="160"
                    cy="160"
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r={radius}
                    fill="none"
                    stroke="url(#cyanGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 160 160)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                  <foreignObject x="0" y="0" width="320" height="320">
                    <div className="w-[320px] h-[320px] flex items-center justify-center">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono text-gray-900 dark:text-white">
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </foreignObject>
                </svg>
              </div>
            );
          })()}

          <div className="flex gap-2 sm:gap-3 lg:gap-4 justify-center flex-wrap">

            <button
              onClick={toggleTimer}
              className="px-6 sm:px-8 lg:px-10 py-2 sm:py-2.5 lg:py-3 rounded-lg
                bg-cyan-500 hover:bg-cyan-600
                text-white font-semibold transition-all duration-300
                shadow-lg hover:shadow-xl uppercase text-xs sm:text-sm tracking-wide"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>


            <button
              onClick={resetTimer}
              className="px-6 sm:px-8 lg:px-10 py-2 sm:py-2.5 lg:py-3 rounded-lg
                bg-gray-600 hover:bg-gray-700
                text-white font-semibold transition-all duration-300
                shadow-lg hover:shadow-xl uppercase text-xs sm:text-sm tracking-wide"
            >
              Reset
            </button>

            <button
              onClick={() => {
                pauseTimer();
                const wasBreak = isBreak;
                if (wasBreak) {
                  setIsLongBreak(false);
                  setTimeLeft(settings.workDuration * 60);
                  setIsBreak(false);
                } else {
                  const newSessionCount = sessionCount + 1;
                  const isLongBreakNext = newSessionCount % settings.longBreakInterval === 0;
                  const breakDuration = isLongBreakNext ? settings.longBreakDuration : settings.shortBreakDuration;
                  setTimeLeft(breakDuration * 60);
                  setIsLongBreak(isLongBreakNext);
                  setSessionCount(newSessionCount);
                  setIsBreak(true);
                }
              }}
              className="px-6 sm:px-8 lg:px-10 py-2 sm:py-2.5 lg:py-3 rounded-lg
                bg-amber-500 hover:bg-amber-600
                text-white font-semibold transition-all duration-300
                shadow-lg hover:shadow-xl uppercase text-xs sm:text-sm tracking-wide"
            >
              Skip
            </button>

          </div>

          <button
            onClick={() => setShowInstructions(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg mt-2 sm:mt-3 
              bg-purple-500 hover:bg-purple-600 
              text-white font-semibold text-xs sm:text-sm"
          >
            Activate Distraction Blocker
          </button>

          <div className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            Session {sessionCount % settings.longBreakInterval || settings.longBreakInterval} of {settings.longBreakInterval}
          </div>
        </div>

        <div className="mt-4 sm:mt-6 lg:mt-8">
          <label htmlFor="taskSelect" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
            Link to Task (optional)
          </label>
          <select
            id="taskSelect"
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="w-full p-2 sm:p-3 border 
              border-gray-200 dark:border-gray-600 
              rounded-lg 
              bg-violet-50 dark:bg-gray-700 
              text-gray-900 dark:text-white
              text-xs sm:text-sm
              focus:border-violet-400 focus:outline-none transition-colors"
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

      {/* SIDEBAR - Hidden on mobile, shown on lg screens */}
      <section className="hidden lg:flex w-80 glass-panel rounded-2xl p-8 flex-col text-gray-900 dark:text-white overflow-hidden">

        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Activity Log & Insights</h2>

        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p className="text-lg font-medium">No sessions completed yet</p>
            </div>
          ) : (
            <div className="space-y-4">

              {(() => {
                const shortBreaks = history.filter(s => s.type === 'short_break');
                const longBreaks = history.filter(s => s.type === 'long_break');
                const focuses = history.filter(s => s.type === 'focus');

                return (
                  <>
                    {shortBreaks.length > 0 && (
                      <div>
                        <h3 className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400 mb-3">Short Breaks</h3>
                        {shortBreaks.slice(0, 3).map((session) => (
                          <div key={session.id} className="flex items-center justify-between mb-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gray-800 dark:bg-cyan-500"></span>
                              <span className="text-gray-700 dark:text-gray-300">{session.taskTitle || 'Break'}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(session.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {longBreaks.length > 0 && (
                      <div>
                        <h3 className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400 mb-3 mt-6">Long Breaks</h3>
                        {longBreaks.slice(0, 2).map((session) => (
                          <div key={session.id} className="flex items-center justify-between mb-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-700 dark:bg-green-500"></span>
                              <span className="text-gray-700 dark:text-gray-300">{session.taskTitle || 'Long Break'}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(session.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {focuses.length > 0 && (
                      <div>
                        <h3 className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400 mb-3 mt-6">Focus Sessions</h3>
                        {focuses.slice(0, 5).map((session) => (
                          <div key={session.id} className="flex items-center justify-between mb-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span className="text-gray-700 dark:text-gray-300">{session.taskTitle || 'Focus'}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(session.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              📊 Daily Focus
            </h3>
            <div className="glass-panel rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Focus Time: <span className="font-bold text-gray-900 dark:text-white">{history.filter(s => s.type === 'focus').reduce((acc, s) => acc + s.duration, 0)} min</span>
              </p>
            </div>
          </div>
        )}
      </section>

      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="glass-panel text-black dark:text-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-3">How to Install Website Blocker Extension</h2>

            <ol className="list-decimal ml-5 space-y-3 text-sm">

              <li>
                Download the extension folder:
                <a
                  href="https://github.com/Vansh-Vaishnani/planit-pomodoro-blocker/archive/refs/heads/main.zip"
                  target="_blank"
                  className="block mt-2 text-blue-600 underline break-all"
                >
                  👉 Click here to download the Pomodoro Blocker Extension
                </a>
              </li>

              <li>
                Extract the ZIP file on your computer.
                After extracting, open this folder:
                <code className="text-xs block bg-gray-200 dark:bg-gray-700 p-2 rounded mt-2">
                  pomodoro-blocker
                </code>
              </li>

              <li>Open Google Chrome and go to: <b>chrome://extensions</b></li>

              <li>Enable <b>Developer Mode</b> (top-right corner)</li>

              <li>
                Click <b>Load Unpacked</b> and select the extracted folder:
                <code className="text-xs block bg-gray-200 dark:bg-gray-700 p-2 rounded mt-2">
                  pomodoro-blocker
                </code>
              </li>

              <li>Make sure the extension is toggled ON.</li>

              <li className="font-semibold text-blue-500">
                Now you can add distracting websites inside the extension settings.
                These websites will be blocked automatically during Pomodoro Focus mode.
              </li>

            </ol>

            <button
              onClick={() => setShowInstructions(false)}
              className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

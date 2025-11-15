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
      setHistory(JSON.parse(savedHistory));
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
    <div className="flex flex-1 gap-8 p-8 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Main Pomodoro Section */}
      <section className="flex-1 bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-2xl p-12 flex flex-col text-white">
        <h1 className="text-3xl font-bold mb-12 text-white">Pomodoro Timer</h1>

        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* Session Type */}
          <div className="text-xl font-light tracking-wide text-gray-300">
            {isBreak ? (isLongBreak ? 'Long Break' : 'Short Break') : 'Focus Session'}
          </div>
          
          {/* Timer Circle */}
          {(() => {
            const totalSeconds = isBreak
              ? (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60
              : settings.workDuration * 60;
            const progress = Math.max(0, Math.min(1, timeLeft / totalSeconds));
            const radius = 90;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);
            const ringColor = getTimerColor();
            const trackColor = '#374151';
            return (
              <div className="relative shadow-2xl shadow-cyan-500/40 rounded-full">
                <svg width="240" height="240" viewBox="0 0 240 240" className="block drop-shadow-xl">
                  {/* Background Circle */}
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={10}
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={10}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 120 120)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                  <foreignObject x="0" y="0" width="240" height="240">
                    <div className="w-[240px] h-[240px] flex items-center justify-center">
                      <div className="text-5xl font-bold font-mono text-white">
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </foreignObject>
                </svg>
              </div>
            );
          })()}

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={toggleTimer}
              className="px-10 py-3 rounded-lg bg-gray-800 hover:bg-gray-900 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl uppercase text-sm tracking-wide"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="px-10 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl uppercase text-sm tracking-wide"
            >
              Reset
            </button>
            <button
              onClick={skipSession}
              className="px-10 py-3 rounded-lg bg-gray-700 hover:bg-gray-800 dark:bg-pink-500 dark:hover:bg-pink-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl uppercase text-sm tracking-wide"
            >
              Skip
            </button>
          </div>
          <button
            onClick={() => setShowInstructions(true)}
            className="px-4 py-2 rounded-lg mt-3 bg-purple-600 text-white font-semibold hover:bg-purple-700"
          >
            Extension Instructions
          </button>

          {/* Session Counter */}
          <div className="text-center text-gray-400 text-sm">
            Session {sessionCount % settings.longBreakInterval || settings.longBreakInterval} of {settings.longBreakInterval}
          </div>
        </div>

        {/* Task Selection */}
        <div className="mt-8">
          <label htmlFor="taskSelect" className="block text-sm font-semibold text-gray-300 mb-3">
            Link to Task (optional)
          </label>
          <select
            id="taskSelect"
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-cyan-500 focus:outline-none transition-colors"
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

      {/* Activity Log & Insights Sidebar */}
      <section className="w-80 bg-gray-100 dark:bg-gray-700 rounded-2xl shadow-xl p-8 flex flex-col text-gray-900 dark:text-white overflow-hidden">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Activity Log & Insights</h2>
        
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p className="text-lg font-medium">No sessions completed yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group by type */}
              {(() => {
                const breaks = history.filter(s => s.type === 'break');
                const focuses = history.filter(s => s.type === 'focus');
                
                return (
                  <>
                    {breaks.length > 0 && (
                      <div>
                        <h3 className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400 mb-3">Short Break</h3>
                        {breaks.slice(0, 3).map((session) => (
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

        {/* Daily Focus Stats */}
        {history.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-600">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              📊 Daily Focus
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Focus Time: <span className="font-bold text-gray-900 dark:text-white">{history.filter(s => s.type === 'focus').length * 25} min</span>
              </p>
            </div>
          </div>
        )}
      </section>
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-black dark:bg-gray-800 dark:text-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-3">How to Install Website Blocker Extension</h2>

            <ol className="list-decimal ml-5 space-y-3 text-sm">

              <li>
                Download the extension folder:
                <a
                  href="https://download-directory.github.io/?url=https://github.com/MeghOffical/Task_Scheduler/tree/main/planit-next/extensions/pomodoro-blocker"
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

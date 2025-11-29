"use client";

import { useMusic } from "./MusicPlayerProvider";
import { useEffect, useRef, useState } from "react";

export default function FloatingMusicBar() {
  const { audioRef, isPlaying, pauseMusic, resumeMusic, fileName, stopMusic, nextSong, prevSong } = useMusic();

  const barRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const posRef = useRef({ x: 20, y: 80 });

  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Smooth drag using window mousemove and requestAnimationFrame
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;

      requestAnimationFrame(() => {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;

        posRef.current = { x: newX, y: newY };
        setPos({ x: newX, y: newY });
      });
    };

    const handleMouseUp = () => setDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const dragStart = (e: any) => {
    setDragging(true);

    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Song time + progress updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);

      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress(isNaN(percent) ? 0 : percent);
    };

    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", update);

    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", update);
    };
  }, [audioRef]);

  if (!fileName) return null;

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={barRef}
      onMouseDown={dragStart}
      className="
        fixed flex flex-col shadow-xl backdrop-blur-lg
        bg-black/70 border border-white/10
        rounded-2xl p-4 min-w-[260px] cursor-grab select-none
        text-white transition-transform
      "
      style={{
        left: pos.x,
        top: pos.y,
        zIndex: 99999,
        willChange: "transform",
      }}
    >
      {/* Song Name */}
      <div className="flex justify-between items-center gap-3">
        <span className="font-medium text-sm truncate max-w-[160px]">
          {fileName}
        </span>

        {/* Close */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            stopMusic();
          }}
          className="text-red-400 hover:text-red-500 transition p-1"
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-2">
        {/* Previous Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevSong();
          }}
          className="hover:scale-110 transition p-1"
          title="Previous Song"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
          </svg>
        </button>

        {isPlaying ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              pauseMusic();
            }}
            className="hover:scale-110 transition p-1"
            title="Pause"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              resumeMusic();
            }}
            className="hover:scale-110 transition p-1"
            title="Play"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </button>
        )}

        {/* Next/Skip Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextSong();
          }}
          className="hover:scale-110 transition p-1"
          title="Next Song"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
          </svg>
        </button>

        <span className="text-xs text-gray-300">{formatTime(currentTime)}</span>
        <span className="text-xs text-gray-300 ml-auto">{formatTime(duration)}</span>
      </div>

      {/* Progress */}
      <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
        <div
          className="h-full bg-cyan-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

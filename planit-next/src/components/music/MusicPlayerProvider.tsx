"use client";

import { createContext, useContext, useRef, useState, useEffect } from "react";

interface MusicContextType {
  audioRef: React.RefObject<HTMLAudioElement>;
  loadPlaylist: (files: File[]) => void;
  playCurrent: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  stopMusic: () => void;
  nextSong: () => void;
  prevSong: () => void;
  selectSong: (index: number) => void;
  isPlaying: boolean;
  fileName: string;
  playlist: File[];
  currentIndex: number;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playlist, setPlaylist] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState("");

  const loadPlaylist = (files: File[]) => {
    if (!files || files.length === 0) return;
    setPlaylist(files);
    setCurrentIndex(0);
    setFileName(files[0].name);

    const firstUrl = URL.createObjectURL(files[0]);
    if (audioRef.current) {
      audioRef.current.src = firstUrl;
      audioRef.current.load();
    }
    setIsPlaying(false);
  };

  const playCurrent = () => {
    const song = playlist[currentIndex];
    if (!song || !audioRef.current) return;
    const url = URL.createObjectURL(song);
    audioRef.current.src = url;
    audioRef.current.play();
    setFileName(song.name);
    setIsPlaying(true);
  };

  const pauseMusic = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const resumeMusic = () => {
    audioRef.current?.play();
    setIsPlaying(true);
  };

  const stopMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
    audio.load();
    setIsPlaying(false);
    setFileName("");
    setPlaylist([]);
    setCurrentIndex(0);
  };

  const nextSong = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    const song = playlist[nextIndex];
    setFileName(song.name);
    const url = URL.createObjectURL(song);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }
    setIsPlaying(true);
  };

  const prevSong = () => {
    if (playlist.length === 0) return;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prevIndex);
    const song = playlist[prevIndex];
    setFileName(song.name);
    const url = URL.createObjectURL(song);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }
    setIsPlaying(true);
  };

  const selectSong = (index: number) => {
    if (playlist.length === 0 || index < 0 || index >= playlist.length) return;
    setCurrentIndex(index);
    const song = playlist[index];
    setFileName(song.name);
    const url = URL.createObjectURL(song);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }
    setIsPlaying(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => {
      // advance automatically when ended
      if (playlist.length > 0) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < playlist.length) {
          setCurrentIndex(nextIndex);
          const song = playlist[nextIndex];
          setFileName(song.name);
          const url = URL.createObjectURL(song);
          audio.src = url;
          audio.play();
          setIsPlaying(true);
        } else {
          // optionally stop at end
          setIsPlaying(false);
        }
      }
    };
    audio.addEventListener("ended", onEnd);
    return () => audio.removeEventListener("ended", onEnd);
  }, [currentIndex, playlist]);

  return (
    <MusicContext.Provider
      value={{
        audioRef,
        loadPlaylist,
        playCurrent,
        pauseMusic,
        resumeMusic,
        stopMusic,
        nextSong,
        prevSong,
        selectSong,
        isPlaying,
        fileName,
        playlist,
        currentIndex,
      }}
    >
      {children}
      <audio ref={audioRef} />
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside MusicPlayerProvider");
  return ctx;
};

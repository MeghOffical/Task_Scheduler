"use client";

import { useMusic } from "./MusicPlayerProvider";

export default function MusicFilePicker() {
  const { loadPlaylist } = useMusic();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    loadPlaylist(fileArray);
  };

  return (
    <label className="
      px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 
      text-white text-sm cursor-pointer transition
    ">
      Select Playlist
      <input type="file" accept="audio/*" multiple hidden onChange={handleFiles} />
    </label>
  );
}

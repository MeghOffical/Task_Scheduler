"use client";

import { useState, useEffect } from "react";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};



export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [corrected, setCorrected] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  //  AUTOCORRECT FUNCTION 
  const autoCorrect = async (text: string) => {
    if (!text || text.length < 3) return;

    try {
      const res = await fetch("/api/autocorrect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      
      const data = await res.json();

      
      if (data.corrected && data.corrected !== text) {
        setCorrected(data.corrected);
      }
    } catch (err) {
      console.error("Autocorrect error:", err);
    }
  };

  
  // HANDLE INPUT CHANGE (with 500ms debounce) 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInput(text);
    setCorrected("");

    if (typingTimeout) clearTimeout(typingTimeout);

    
    const timeout = setTimeout(() => {
      autoCorrect(text);
    }, 500);

    setTypingTimeout(timeout);
  };


  
  const handleSend = async () => {
    if (!input.trim()) return;

    setIsLoading(true);

    // Final correction pass before sending
    let finalText = input;

    try {
      const res = await fetch("/api/autocorrect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();

      if (data.corrected) {
        finalText = data.corrected;
      }
    } catch (err) {
      console.error("Final autocorrect error:", err);
    }

    onSend(finalText);

    setInput("");
    setCorrected("");
    setIsLoading(false);
  };



  
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={corrected || input}
        onChange={handleChange}
        disabled={disabled || isLoading}
        placeholder="Ask me anything..."
        className="w-full px-4 py-3 rounded-xl border 
          border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50"
      />

      {/* Autocorrect suggestion */}
      {corrected && corrected !== input && (
        <div className="mt-1 text-xs text-blue-500 px-1">
          Did you mean: <b>{corrected}</b> ?
        </div>
      )}


      
      {/* SEND BUTTON */}
      <button
        onClick={handleSend}
        disabled={disabled || isLoading || !input.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 
          bg-gradient-to-br from-blue-600 to-purple-600
          text-white px-4 py-2 
          rounded-lg text-sm font-semibold
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
}

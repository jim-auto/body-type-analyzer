"use client";

import { useState, useEffect, useRef } from "react";

const messages = [
  "骨格をなんとなく解析中…",
  "AIが雰囲気で判断しています…",
  "体型バランスを数値化中…",
  "偏差値をフィーリングで算出中…",
  "もっともらしい結果を生成中…",
];

type Props = {
  onComplete: () => void;
};

export default function LoadingAnimation({ onComplete }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i < messages.length; i++) {
      const timer = setTimeout(() => {
        setMessageIndex(i);
      }, i * 1500);
      timers.push(timer);
    }

    // After the last message has been shown for 1.5s, call onComplete
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, messages.length * 1500);
    timers.push(completeTimer);

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const progress = ((messageIndex + 1) / messages.length) * 100;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center">
      <p className="text-lg font-medium text-blue-600 animate-pulse">
        {messages[messageIndex]}
      </p>
      <div
        className="h-3 w-full rounded-full bg-slate-200 overflow-hidden"
        data-testid="progress-bar"
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          data-testid="progress-fill"
        />
      </div>
      <p className="text-sm text-slate-400">{Math.round(progress)}%</p>
    </div>
  );
}

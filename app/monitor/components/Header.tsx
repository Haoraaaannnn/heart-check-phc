'use client';

import React from 'react';
import Link from 'next/link';

type HeaderProps = {
  title: string;
  currentTime: Date;
};

export function Header({ title, currentTime }: HeaderProps) {
  return (
    <div className="bg-[#cc3535] px-[clamp(16px,3vw,48px)] py-[clamp(8px,1.6vh,28px)] flex items-center justify-between gap-4">
      <div className="flex items-center gap-[clamp(10px,1.5vw,20px)] min-w-0">
        <Link
          href="/select-screen"
          className="p-[clamp(6px,1vh,12px)] bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-2xl transition flex items-center justify-center shrink-0"
          title="Return to Select Screen"
          aria-label="Return to Select Screen"
        >
          <i className="bx bx-grid-alt text-[clamp(18px,3.2vh,32px)]" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <p className="text-white/70 text-[clamp(10px,1.7vh,20px)] uppercase tracking-widest font-medium">
            OUT-PATIENT DIVISION
          </p>
          <h1 className="text-white text-[clamp(24px,6vh,72px)] leading-tight font-black break-words">
            {title}
          </h1>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white text-[clamp(22px,5vh,60px)] leading-tight font-bold tabular-nums">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-white/70 text-[clamp(10px,1.7vh,20px)]">
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
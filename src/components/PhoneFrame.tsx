import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden font-sans">
      {/* Outer Phone Shell - visible only on larger tablet/desktop wrappers */}
      <div className="relative bg-slate-900 border-4 sm:border-[8px] border-slate-800 rounded-none sm:rounded-[48px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] w-full max-w-full sm:max-w-[420px] h-screen sm:h-[880px] flex flex-col overflow-hidden ring-1 ring-white/10">

        {/* Main Application Window (Simulates full client frame) */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative flex flex-col no-scrollbar">
          {children}
        </div>

        {/* Bottom Android Gesture/Softkeys Bar */}
        <div className="bg-slate-900 text-slate-500 py-3 px-12 flex items-center justify-between z-40 shrink-0 border-t border-slate-800/80 rounded-b-none sm:rounded-b-[40px]">
          {/* Back button */}
          <button className="p-1 hover:text-white transition-colors">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
            </svg>
          </button>
          {/* Home button */}
          <button className="w-12 h-3.5 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-700/40"></button>
          {/* Recent Apps button */}
          <button className="p-1 hover:text-white transition-colors">
            <div className="w-3.5 h-3.5 border-2 border-current rounded-sm"></div>
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Wifi, Battery, ShieldAlert, Cpu } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // any hour 0 becomes 12
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden font-sans">
      {/* Outer Phone Shell - visible only on larger tablet/desktop wrappers */}
      <div className="relative bg-slate-900 border-4 sm:border-[8px] border-slate-800 rounded-none sm:rounded-[48px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] w-full max-w-full sm:max-w-[420px] h-screen sm:h-[880px] flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Android Speaker and Punch-Hole Camera */}
        <div className="hidden sm:flex absolute top-2 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-900 rounded-b-2xl z-50 items-center justify-center">
          {/* Speaker */}
          <div className="w-12 h-1 bg-slate-800 rounded-full mr-3 border-t border-white/5"></div>
          {/* Camera lens */}
          <div className="w-3.5 h-3.5 bg-black rounded-full ring-2 ring-slate-800/80 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-blue-900/50 rounded-full"></div>
          </div>
        </div>

        {/* Dynamic Android Status Bar (Edge-to-Edge) */}
        <div className="bg-[#E2125B] text-white px-6 pt-3 pb-1 h-10 select-none flex items-center justify-between z-40 text-xs font-semibold tracking-wide border-b border-rose-700/30 shrink-0">
          <div className="flex items-center gap-1">
            <span className="font-sans text-[11px] select-none tracking-normal">{time}</span>
          </div>
          
          {/* Status Icons */}
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 opacity-90 animate-pulse text-indigo-200" />
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-rose-100 font-mono">Agent v1.0</span>
            <Wifi className="w-3.5 h-3.5 opacity-90" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono leading-none">98%</span>
              <Battery className="w-4 h-4 rotate-0 opacity-95 shrink-0" />
            </div>
          </div>
        </div>

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

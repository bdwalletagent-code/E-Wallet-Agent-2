import React from 'react';
import { Send, BookOpen, Star, HelpCircle, TrendingUp, DollarSign, Zap } from 'lucide-react';

export default function HelpDesk() {
  return (
    <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm mt-4 text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-50 text-[#E2125B]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">এজেন্ট নির্দেশিকা ও সহায়তা</h3>
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">How to Grow Earnings</span>
          </div>
        </div>

        {/* Telegram Circular Active Launcher button */}
        <a 
          href="https://t.me/bdwalletagent" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#229ED9] hover:bg-[#1f8ec4] text-white transition-transform duration-300 hover:scale-110 shadow-lg shadow-blue-500/20 cursor-pointer"
          title="Join Telegram Support"
          id="telegram_link"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M9.78 18.65l.28-4.28 7.76-7c.34-.3-.07-.46-.52-.16L7.74 13.3 3.6 11.98c-.9-.28-.92-.9.19-1.33l16.16-6.23c.75-.28 1.4.17 1.15 1.25l-2.75 12.95c-.2 1-.8 1.24-1.63.78l-4.17-3.07-2.01 1.94c-.22.22-.4.41-.83.41z"/>
          </svg>
        </a>
      </div>

      <div className="space-y-4 text-xs text-slate-600">
        
        {/* Core Calculation Example */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>কমিশন হিসেব ও মুনাফা (Real Example)</span>
          </div>
          <p className="leading-relaxed mb-2 text-[11px] text-slate-500">
            যখন আপনি ১০$ সমপরিমাণ <strong>১২০০ টাকা</strong> ওয়ালেটে রিফিল করবেন, তখন স্বয়ংক্রিয়ভাবে আপনি নিচের মতো গ্রাহক লেনদেনের অনুরোধ পাবেনঃ
          </p>
          
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-rose-50/50 p-2 rounded-xl text-center border border-rose-100">
              <span className="text-[10px] text-rose-500 block">১ম ডিপোজিট</span>
              <span className="font-mono font-bold text-rose-700">৳৫০০</span>
              <span className="text-[9px] text-rose-500 block">কমিশন: ৳২৫</span>
            </div>
            
            <div className="bg-rose-50/50 p-2 rounded-xl text-center border border-rose-100">
              <span className="text-[10px] text-rose-500 block">২য় ডিপোজিট</span>
              <span className="font-mono font-bold text-rose-700">৳৫০০</span>
              <span className="text-[9px] text-rose-500 block">কমিশন: ৳২৫</span>
            </div>

            <div className="bg-sky-50/50 p-2 rounded-xl text-center border border-sky-100">
              <span className="text-[10px] text-sky-500 block">১ম উইথড্র</span>
              <span className="font-mono font-bold text-sky-700">৳২০০</span>
              <span className="text-[9px] text-sky-500 block">কমিশন: ৳৬</span>
            </div>
          </div>

          <div className="mt-3 text-[11px] bg-emerald-50 rounded-xl p-2 text-center text-emerald-800 font-semibold border border-emerald-100">
            মোট ১২০০ টাকা লেনদেনে লাভ = ৳৫৬ (কমিশন)!
          </div>
        </div>

        {/* Growth points */}
        <div className="space-y-3">
          
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600 font-bold text-[10px]">১</div>
            <div>
              <h4 className="font-bold text-slate-800">পর্যাপ্ত ব্যালেন্স রাখুন (Fund Safety Guard)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                আপনার এজেন্ট ওয়ালেটে যত বেশি <strong>Wallet Balance</strong> রাখবেন, ঠিক তত ডাবল সমপরিমাণ গ্রাহকদের ডিপোজিট এবং উইথড্র পেন্ডিং রিকুয়েস্ট আপনার এ্যাপে লোড হতে থাকবে।
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600 font-bold text-[10px]">২</div>
            <div>
              <h4 className="font-bold text-slate-800">৫% এবং ৩% হাই-কমিশন মডেল</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                প্রতিটি ক্যাশ-ইন (ডিপোজিট) সফলভাবে এপ্রুভ করলে পাবেন <strong>৫% কমিশন</strong> এবং ক্যাশ-আউট (উইথড্র) সফল এপ্রুভে পাবেন <strong>৩% কমিশন</strong>, যা সাথে সাথে কমিশন ব্যালেন্সে যুক্ত হবে।
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600 font-bold text-[10px]">৩</div>
            <div>
              <h4 className="font-bold text-slate-800">কমিশন ব্যালেন্স উত্তোলন (Easy Cash Out)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                কমিশন ব্যালেন্স যেকোনো সময়ে সরাসরি আপনার নিজের বিকাশ বা নগদ নম্বরের মাধ্যমে ক্যাশ আউট করে পকেটে নিতে পারবেন <strong>(Agent Withdraw)</strong> অপশন ব্যবহার করে।
              </p>
            </div>
          </div>

        </div>

        {/* Contact info bar */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>যেকোনো প্রশ্ন বা এজেন্ট সাপোর্টের জন্য:</span>
          <a 
            href="https://t.me/bdwalletagent" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#229ED9] underline font-semibold flex items-center gap-0.5"
          >
            Telegram Client Channels
          </a>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { 
  TrendingUp, 
  Zap, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  DollarSign, 
  Compass 
} from 'lucide-react';

export default function HelpDesk() {
  return (
    <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-sm mt-4 text-left space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">ওয়ালেট এজেন্ট অফিসিয়াল নির্দেশিকা</h3>
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wide">BD Wallet Agent Guide Book</span>
          </div>
        </div>

        {/* Telegram Circular Active Launcher button */}
        <a 
          href="https://t.me/bdwalletagent" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#229ED9] hover:bg-[#1f8ec4] text-white transition-transform duration-300 hover:scale-110 shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
          title="Join Telegram Support"
          id="telegram_link_desk"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M9.78 18.65l.28-4.28 7.76-7c.34-.3-.07-.46-.52-.16L7.74 13.3 3.6 11.98c-.9-.28-.92-.9.19-1.33l16.16-6.23c.75-.28 1.4.17 1.15 1.25l-2.75 12.95c-.2 1-.8 1.24-1.63.78l-4.17-3.07-2.01 1.94c-.22.22-.4.41-.83.41z"/>
          </svg>
        </a>
      </div>

      <div className="space-y-5 text-xs text-slate-700 leading-relaxed">

        {/* Section 1: Core Job Responsibilities */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 font-black text-slate-800 border-b border-slate-200 pb-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
              ১
            </div>
            <span className="text-[12px]">ডিপোজিট অনুরোধ প্রসেস করার নিয়ম (Wallet Agent Job)</span>
          </div>
          
          <p className="text-[11px] text-slate-600 leading-relaxed">
            কোনো খেলোয়াড় / গ্রাহক তাদের নিজেদের গেমিং বা ওয়ালেট অ্যাকাউন্টে টাকা সফলভাবে ডিপোজিট করার জন্য স্ক্রিনে প্রদর্শিত <span className="text-indigo-805 font-bold">Super Agent এর নাম্বারে</span> নিজস্ব অর্থ পাঠিয়েছেন। তাই এখন একজন Wallet Agent হিসেবে আপনার মূল দায়িত্ব ও কাজ হলো নিম্নরূপ:
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-[11px]">১১ ডিজিটের মোবাইল নম্বর যাচাইকরণ:</p>
                <p className="text-[10px] text-slate-500">গ্রাহকের পাঠানো মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে। যদি কাস্টমার ভুলবশত ১০ ডিজিট নম্বর বা অসঙ্গতিপূর্ণ ডেটা দিয়ে অনুরোধ পাঠায়, তবে সাথে সাথে তা বাতিল করে দিন।</p>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-[11px]">মেসেজ নোটিফিকেশন ও অনুরোধের মিলকরণ:</p>
                <p className="text-[10px] text-slate-500">আপনাদের রিসিভড মেসেজের আসল টাকার পরিমাণের সাথে ডিপোজিট অনুরোধের পরিমাণ সঠিক আছে কিনা তা মিলিয়ে ডেটা ম্যাচ করুন।</p>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-[11px]">প্রতিটি লেনদেনের কমিশন ট্র্যাকিং:</p>
                <p className="text-[10px] text-slate-500">প্রতিটি সফল ক্যাশ-ইন এপ্রুভাল এর বিপরীতে ৫% এবং ক্যাশ-আউটে ৩% কমিশন লাভ যুক্ত হচ্ছে কিনা তা বিবেচনা করে ডিপোজিটটি এপ্রুভ করুন অথবা তাৎক্ষণিক বাতিল করুন।</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Commission Withdrawal Policy */}
        <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-150 space-y-3">
          <div className="flex items-center gap-2 font-black text-rose-900 border-b border-rose-200 pb-1.5">
            <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-[#E2125B] font-bold text-xs shrink-0">
              ২
            </div>
            <span className="text-[12px]">কমিশন ও ওয়ালেট ব্যালেন্স উইথড্র নীতি</span>
          </div>

          <div className="space-y-3 text-[11px] font-semibold text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-550 mt-1.5 shrink-0" />
              <p>
                <span className="font-bold text-slate-850">৩০% এবং ৭০% কমিশন ডিস্ট্রিবিউটঃ</span> ওয়ালেট এজেন্টরা সর্বমোট কমিশন ব্যালেন্সের <span className="text-[#E2125B] font-bold">সর্বোচ্চ ৩০% অর্থ উত্তোলন বা উইথড্র</span> করতে পারবেন। অবশিষ্ট <span className="text-rose-700 font-bold">৭০% কমিশন Super Agent এর প্রাপ্য বা পাওনা আদায়</span>।
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <p>
                <span className="font-bold text-slate-850">সুপার এজেন্ট অর্থ সমন্বয়ঃ</span> যেহেতু ওয়ালেট এজেন্টদের মূল ব্যালেন্সে সরাসরি Super Agent নিজের অর্থ/টাকা বা টোকেন প্রদান করে থাকেন, তাই সিকিউরিটি এবং ব্যবসায়িক নিয়ম অনুযায়ী অর্জিত আয়ের অবশিষ্ট ৭০% লভ্যাংশ সুপার এজেন্টের প্রাপ্য আদায় হিসেবে কেটে নেওয়া হয়।
              </p>
            </div>

            <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-rose-100">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-emerald-900 text-[10.5px]">
                <span className="font-extrabold block text-emerald-955 mb-0.5">💡 ১০০% কমিশন নিজের পকেটে নেওয়ার শর্ত:</span>
                যদি কোনো এজেন্ট আয়ের পুরো <strong>১০০% কমিশন নিজে উইথড্র করতে চান</strong>, তবে তাকে অবশ্যই <strong>নিজের ব্যক্তিগত অর্থ বা পুঁজি</strong> বিনিয়োগ করে ব্যালেন্স রিফিল করে কমিশন অর্জন করতে হবে। অন্যথায় সুপার এজেন্টের পুঁজিতে কাজ করলে অর্জিত মোট লভ্যাংশের ৭০% কমিশনই সুপার এজেন্ট প্রাপ্য হবেন।
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-550 mt-1.5 shrink-0" />
              <p className="text-rose-750 font-bold">
                ⚠️ মূল ওয়ালেট থেকে উইথড্র নিষিদ্ধ: নিরাপত্তা পলিসির অধীনে মূল ওয়ালেট ব্যালেন্স (Wallet Balance) থেকে কোনো প্রকার ক্যাশ-আউট বা উত্তোলন করা যায় না। এটি কেবলমাত্র গ্রাহকদের পেন্ডিং ডিপোজিট এপ্রুভ করার কাজে ব্যবহারযোগ্য।
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Refill Agent Account & Payment options */}
        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-3">
          <div className="flex items-center gap-2 font-black text-indigo-900 border-b border-indigo-200 pb-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
              ৩
            </div>
            <span className="text-[12px]">এজেন্ট ওয়ালেট ব্যালেন্স রিফিল গাইডলাইন</span>
          </div>

          <p className="text-[11px] text-slate-600">
            ব্যালেন্স ফুরিয়ে গেলে এ্যাপে নতুন করে কাজ করার জন্য আপনাদের ব্যালেন্স রিফিল করতে নিচের দুটি মেথড ব্যবহার করতে পারবেন:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3 rounded-2xl border border-indigo-100 space-y-1.5">
              <p className="font-extrabold text-indigo-950 text-[11px] flex items-center gap-1">
                <span>১. Super Agent রিফিল (সাধারণ)</span>
              </p>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                এজেন্টরা ক্যাশ রিফিল অপশনে গিয়ে তাদের <span className="text-indigo-800 font-bold">এজেন্ট আইডি</span> এবং রিফিলের পরিমাণ লিখে সরাসরি Super Agent এর কাছে রিকোয়েস্ট সাবমিট করবেন। অনুরোধ জানানোর পর ফিজিক্যাল স্ক্রিনশটটি কপি করে <strong>অফিশিয়াল টেলিগ্রামে</strong> সুপার এজেন্টের নিকট জমা দিয়ে ব্যালেন্স প্রাপ্তি নিশ্চিত করবেন।
              </p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-emerald-100/80 space-y-1.5">
              <p className="font-extrabold text-emerald-950 text-[11px] flex items-center gap-1">
                <span className="text-emerald-700">২. Admin রিফিল (১০০% কমিশন লাভ)</span>
              </p>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                যদি এজেন্টরা নিজেদের পুঁজি বিনিয়োগ করে ১০০% কমিশন লাভ করার জন্য রিফিল করতে চান, তবে <strong>'টাকা পাঠানোর এডমিন বিবরণ'</strong> অপশনে ক্লিক করে ফর্মে প্রবেশ করবেন। স্ক্রিনে প্রদর্শিত বিকাশ/নগদ নাম্বারে টাকা পাঠিয়ে সেন্ডার নম্বর এবং ট্রানজেকশন আইডি (TxID) এ্যাপের ফর্মে সাবমিট করবেন এবং পেমেন্ট রশিদটির একটি চমৎকার স্ক্রিনশট সরাসরি <strong>Super Admin</strong> এর ব্যক্তিগত টেলিগ্রামে পাঠিয়ে দ্রুততম সময়ে রিফিল সম্পন্ন করবেন।
              </p>
            </div>
          </div>
        </div>

        {/* Real Example Calculations */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl p-3.5 border border-amber-250 text-amber-950">
          <p className="font-extrabold flex items-center gap-1.5 text-amber-900 mb-1">
            <TrendingUp className="w-4 h-4 shrink-0 text-amber-700" />
            এজেন্ট কমিশন উপার্জনের বাস্তব উদাহরণ (৫% এবং ৩%):
          </p>
          <p className="text-[10.5px] leading-relaxed text-slate-700 font-semibold">
            যদি আপনার অ্যাকাউন্টে ১০$ বা ১২০০ টাকা সচল রিয়াল ব্যালেন্স থাকে এবং আপনি ২টি ৫০০ টাকার ডিপোজিট (৫% কমিশন লাভ = ৫০ টাকা) এবং ১টি ২০০ টাকার উইথড্র রিকোয়েস্ট (৩% কমিশন লাভ = ৬ টাকা) প্রসেস করেন, তবে কোনো প্রকার জটিলতা ছাড়াই কয়েক মিনিটে আপনার মোট উপার্জিত কমিশন হবে ৫৬ টাকা!
          </p>
        </div>

      </div>

      {/* Guide Desk Footer */}
      <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
        <span className="font-medium text-slate-400">© ২০২৬ BD Wallet Agent • সর্বস্বত্ব সংরক্ষিত।</span>
        <a 
          href="https://t.me/bdwalletagent" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[#229ED9] hover:underline font-extrabold flex items-center gap-0.5"
        >
          অফিসিয়াল টেলিগ্রাম সাপোর্ট চ্যানেলে যোগ দিন
        </a>
      </div>

    </div>
  );
}

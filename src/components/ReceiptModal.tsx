import { CheckCircle2, Copy, Share2, Download, X } from 'lucide-react';
import React, { useState } from 'react';
import { TransactionRecord } from '../types';

interface ReceiptModalProps {
  transaction: TransactionRecord;
  onClose: () => void;
}

export default function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `E-Wallet Agent Receipt\n-----------------------\nType: ${transaction.type.toUpperCase()}\nTxn ID: ${transaction.id}\nAmount: ${transaction.amount} BDT\nCommission: ${transaction.commissionEarned} BDT\nPhone: ${transaction.customerPhone}\nDate: ${new Date(transaction.createdAt).toLocaleString()}\nStatus: SUCCESS`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBilingualType = (type: string) => {
    switch (type) {
      case 'deposit': return 'ক্যাশ-ইন (Deposit)';
      case 'withdraw': return 'ক্যাশ-আউট (Withdraw)';
      case 'recharge': return 'মোবাইল রিচার্জ (Recharge)';
      case 'bill_pay': return 'বিল পেমেন্ট (Bill Pay)';
      default: return type;
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col">
        
        {/* Confetti top background bar */}
        <div className="bg-emerald-500 h-2.5 w-full"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 text-center overflow-y-auto max-h-[500px] no-scrollbar">
          
          {/* Success Check Badge */}
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-full mb-3 text-emerald-500">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <h3 className="text-xl font-bold text-slate-800">লেনদেন সফল হয়েছে!</h3>
          <p className="text-xs text-slate-400 mt-1">Transaction Successful</p>

          {/* Amount Badge */}
          <div className="mt-4 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 inline-block">
            <span className="text-xs text-slate-500 font-medium block uppercase tracking-wide">মোট পরিমাণ</span>
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">
              ৳{transaction.amount}
            </span>
          </div>

          {/* Earnings Badge */}
          {transaction.commissionEarned > 0 && (
            <div className="mt-2 bg-rose-50 border border-rose-100 rounded-full py-1.5 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>আপনার কমিশন: +৳{transaction.commissionEarned}</span>
            </div>
          )}

          {/* Receipt Parameters Segment */}
          <div className="mt-6 border-t border-dashed border-slate-300 pt-4 text-left space-y-3.5">
            
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500">লেনদেনের ধরণ:</span>
              <span className="font-semibold text-slate-800 text-right">{getBilingualType(transaction.type)}</span>
            </div>

            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500">গ্রাহক নম্বর:</span>
              <span className="font-semibold text-slate-800 font-mono text-right">{transaction.customerPhone}</span>
            </div>

            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500">লেনদেন আইডি (TxnID):</span>
              <div className="flex items-center gap-1 text-right">
                <span className="font-semibold text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                  {transaction.id}
                </span>
                <button 
                  onClick={handleCopy}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                  title="Copy Txn ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500">তারিখ ও সময়:</span>
              <span className="font-semibold text-slate-800 text-right">
                {new Date(transaction.createdAt).toLocaleString('bn-BD', {
                  hour12: true,
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })}
              </span>
            </div>

            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500">সার্ভিস পেমেন্ট:</span>
              <span className="font-semibold text-emerald-600 text-right">ফ্রি (Free)</span>
            </div>

            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500 font-semibold text-slate-700">চার্জ বিবরণ:</span>
              <span className="font-semibold text-slate-800 text-right">{transaction.details || 'সফল ওয়ালেট ট্রানজেকশন'}</span>
            </div>

          </div>

          <div className="mt-6 border-t border-dashed border-slate-300 pt-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">E-Wallet Agent System</span>
            <span className="text-[9px] text-slate-300 mt-0.5">Powered by Secure Firebase Cloud</span>
          </div>

        </div>

        {/* Buttons Row */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-stretch shrink-0">
          <button 
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-100 flex items-center justify-center gap-1.5 text-xs font-semibold select-none cursor-pointer transition-colors"
          >
            <Copy className="w-4 h-4 text-slate-500" />
            {copied ? 'কপি হয়েছে' : 'রসিদ কপি'}
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 text-xs font-semibold select-none cursor-pointer transition-all shadow-md shadow-emerald-500/10"
          >
            <span>সম্পন্ন (Done)</span>
          </button>
        </div>

      </div>
    </div>
  );
}

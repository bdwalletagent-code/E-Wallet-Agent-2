import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  where, 
  getDocs,
  runTransaction,
  deleteDoc
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  AgentProfile, 
  TransactionRecord, 
  AgentCashRequest, 
  AgentWithdrawRequest, 
  TransactionType 
} from './types';
import { generatePreloadedRequests } from './services/requestPool';
import PhoneFrame from './components/PhoneFrame';
import ReceiptModal from './components/ReceiptModal';
import HelpDesk from './components/HelpDesk';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Phone, 
  Receipt, 
  HelpCircle, 
  User as UserIcon, 
  Coins, 
  Smartphone, 
  FileText, 
  Plus, 
  ShieldCheck, 
  LogOut, 
  CheckCircle, 
  X, 
  Bell, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  Image, 
  ChevronRight,
  Info,
  Trash2
} from 'lucide-react';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Authentication form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [viewState, setViewState] = useState<'login' | 'register'>('login');

  // Application view states
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions_list' | 'agent_cash' | 'profile'>('dashboard');
  const [activeFeature, setActiveFeature] = useState<'none' | 'cash_in' | 'cash_out' | 'recharge' | 'bill_pay' | 'agent_cash' | 'agent_withdraw' | 'help_desk' | 'admin_dashboard'>('none');
  
  const [tickTime, setTickTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setTickTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [wthStartTime, setWthStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setWthStartTime(null);
      return;
    }
    if (profile && profile.walletBalance > 0) {
      const key = `wth_start_time_${currentUser.uid}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setWthStartTime(parseInt(saved, 10));
      } else {
        const now = Date.now();
        localStorage.setItem(key, now.toString());
        setWthStartTime(now);
      }
    } else {
      const key = `wth_start_time_${currentUser?.uid}`;
      localStorage.removeItem(key);
      setWthStartTime(null);
    }
  }, [currentUser, profile?.walletBalance]);

  // App notification state
  const [notifications, setNotifications] = useState<{ id: string; title: string; time: string; read: boolean }[]>([
    { id: '1', title: 'ই-ওয়ালেট এজেন্ট ফোরামে স্বাগতম!', time: 'এখন', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Firestore collections states
  const [dbTransactions, setDbTransactions] = useState<TransactionRecord[]>([]);
  const [cashRequests, setCashRequests] = useState<AgentCashRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<AgentWithdrawRequest[]>([]);
  const [adminAgents, setAdminAgents] = useState<AgentProfile[]>([]);

  // Form states of transaction operations
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [rechargeOperator, setRechargeOperator] = useState('Grameenphone');
  const [billerName, setBillerName] = useState('DESCO Electricity');
  const [billMeterNo, setBillMeterNo] = useState('');
  const [agentCashAmount, setAgentCashAmount] = useState('');
  const [agentCashSenderPhone, setAgentCashSenderPhone] = useState('');
  const [agentCashMethod, setAgentCashMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [agentCashTxnId, setAgentCashTxnId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [screenshotFileBase64, setScreenshotFileBase64] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNumber, setWithdrawNumber] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [withdrawSource, setWithdrawSource] = useState<'commission' | 'wallet'>('commission');

  // Receipts / Modals state
  const [showReceipt, setShowReceipt] = useState<TransactionRecord | null>(null);
  const [infoMessage, setInfoMessage] = useState({ text: '', type: 'success' as 'success' | 'error' | 'info' });

  // Cash In dedicated States
  const [cashInTab, setCashInTab] = useState<'requests' | 'cancelled'>('requests');
  const [cashOutTab, setCashOutTab] = useState<'requests' | 'cancelled'>('requests');
  const [rejectingRequest, setRejectingRequest] = useState<TransactionRecord | null>(null);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState('ভুল ট্রানজেকশন আইডি (Invalid TxnID)');

  // Tape balance state similarity to bKash/Nagad
  const [showWalletBalance, setShowWalletBalance] = useState(false);
  const [showCommBalance, setShowCommBalance] = useState(false);

  // Sync auth and profiles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Real-time synchronization of the current user profile from Firestore
        const userRef = doc(db, 'agents', user.uid);
        const unsubscribeProfile = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as AgentProfile);
          } else {
            // Document does not exist yet (e.g. freshly registered, or first sign in). Create.
            const newProfile: AgentProfile = {
              uid: user.uid,
              name: fullName || user.displayName || 'সম্মানিত এজেন্ট',
              email: user.email || '',
              phone: phone || '01XXXXXXXXX',
              walletBalance: 0, // BD starts at zero
              commissionBalance: 0,
              todayTransactionsCount: 0,
              todayEarnings: 0,
              monthlyEarnings: 0,
              totalEarnings: 0,
              role: user.email === 'bdwalletagent@gmail.com' ? 'admin' : 'agent',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `agents/${user.uid}`));

        // Set up snapshot streams for transactions, cash refills, and payout logs
        const transQuery = query(collection(db, 'transactions'), where('agentId', '==', user.uid));
        const unsubscribeTrans = onSnapshot(transQuery, (snap) => {
          const list: TransactionRecord[] = [];
          snap.forEach((doc) => {
            list.push(doc.data() as TransactionRecord);
          });
          setDbTransactions(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });

        const cashQuery = query(collection(db, 'agentCashRequests'), where('agentId', '==', user.uid));
        const unsubscribeCash = onSnapshot(cashQuery, (snap) => {
          const list: AgentCashRequest[] = [];
          snap.forEach((doc) => {
            list.push(doc.data() as AgentCashRequest);
          });
          setCashRequests(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });

        const withdrawQuery = query(collection(db, 'agentWithdrawRequests'), where('agentId', '==', user.uid));
        const unsubscribeWithdraw = onSnapshot(withdrawQuery, (snap) => {
          const list: AgentWithdrawRequest[] = [];
          snap.forEach((doc) => {
            list.push(doc.data() as AgentWithdrawRequest);
          });
          setWithdrawRequests(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });

        // If current user is Admin, listen to all agents & requests
        if (user.email === 'bdwalletagent@gmail.com') {
          const allAgentsQuery = collection(db, 'agents');
          const unsubscribeAllAgents = onSnapshot(allAgentsQuery, (snap) => {
            const list: AgentProfile[] = [];
            snap.forEach((doc) => {
              list.push(doc.data() as AgentProfile);
            });
            setAdminAgents(list);
          });

          // Fetch overall pending cash Refills globally for admin
          const allCashQuery = collection(db, 'agentCashRequests');
          const unsubscribeAllCash = onSnapshot(allCashQuery, (snap) => {
            const list: AgentCashRequest[] = [];
            snap.forEach((doc) => {
              list.push(doc.data() as AgentCashRequest);
            });
            setCashRequests(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          });

          // Fetch overall pending withdrawals globally for admin
          const allWithdrawQuery = collection(db, 'agentWithdrawRequests');
          const unsubscribeAllWithdraw = onSnapshot(allWithdrawQuery, (snap) => {
            const list: AgentWithdrawRequest[] = [];
            snap.forEach((doc) => {
              list.push(doc.data() as AgentWithdrawRequest);
            });
            setWithdrawRequests(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          });

          return () => {
            unsubscribeProfile();
            unsubscribeTrans();
            unsubscribeCash();
            unsubscribeWithdraw();
            unsubscribeAllAgents();
            unsubscribeAllCash();
            unsubscribeAllWithdraw();
          };
        }

        return () => {
          unsubscribeProfile();
          unsubscribeTrans();
          unsubscribeCash();
          unsubscribeWithdraw();
        };
      } else {
        setProfile(null);
        setDbTransactions([]);
        setCashRequests([]);
        setWithdrawRequests([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fullName, phone]);

  // Utility to display messages
  const triggerMessage = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setInfoMessage({ text, type });
    setTimeout(() => setInfoMessage({ text: '', type: 'success' }), 5000);
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      triggerMessage('সফলভাবে লগইন করা হয়েছে।', 'success');
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!fullName || !phone) {
      setAuthError('দয়া করে সম্পূর্ণ নাম এবং মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      triggerMessage('রেজিস্ট্রেশন সফল হয়েছে!', 'success');
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'agent' | 'admin') => {
    setAuthError('');
    setLoading(true);
    const demoEmail = role === 'admin' ? 'bdwalletagent@gmail.com' : 'quickagent@wallet.com';
    const demoPassword = 'Password123!';
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      triggerMessage(`সফলভাবে ${role === 'admin' ? 'এডমিন' : 'এজেন্ট'} মোডে ক্যাশইন লগইন করা হয়েছে।`, 'success');
    } catch (err) {
      // If demo account doesn't exist, create it on the fly!
      try {
        await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        triggerMessage(`সফলভাবে ডেমো ${role} তৈরি করে লগইন করা হয়েছে!`, 'success');
      } catch (createErr: any) {
        setAuthError('ডেমো লগইন ব্যর্থ হয়েছে। ' + createErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setViewState('login');
    triggerMessage('লগআউট সম্পন্ন হয়েছে।', 'info');
  };

  // -----------------------------------------------------------------
  // GENERATE PENDING POOL REQUESTS CALCULATIONS FOR AGENT DEMO TRACKING
  // -----------------------------------------------------------------
  // 200 Deposit and 200 Withdrawal requests programmatically
  // Based on agent's Wallet balance, we simulate allocation of requests:
  // 1200 BDT allocation gets 2 deposits of 500 BDT and 1 withdraw of 200 BDT.
  // The user sees these pending lists based on their current walletBalance and historical approved transactions.
  const allPreloaded = currentUser ? generatePreloadedRequests(currentUser.uid) : [];
  
  // We filter out any preloaded transaction ID that has already been registered inside Firestore as approved or cancelled
  const processedTxIds = new Set(dbTransactions.map(t => t.id));

  // Determine available pending requests from the pool based on Wallet Balance
  // Each approved Deposit subtracts 500. Each approved Withdraw adds 200.
  // We calculate allocated pool: we can show them according to their wallet balance or preloaded limit
  const activeWalletBal = profile?.walletBalance || 0;

  // Let's filter pool requests that are still pending
  const pendingPreloaded = allPreloaded.filter(t => !processedTxIds.has(t.id));
  
  // Distribute pending lists based on current wallet balance
  const getVisiblePendingDeposits = () => {
    let tempBalance = activeWalletBal;
    const result: TransactionRecord[] = [];
    const pendingDeps = pendingPreloaded.filter(t => t.type === 'deposit');
    for (const req of pendingDeps) {
      if (tempBalance >= req.amount) {
        result.push(req);
        tempBalance -= req.amount;
      } else {
        break;
      }
    }
    return result;
  };

  const visiblePendingDeposits = getVisiblePendingDeposits();
  const totalLockedDepositsCount = pendingPreloaded.filter(t => t.type === 'deposit').length - visiblePendingDeposits.length;

  const getVisiblePendingWithdrawals = () => {
    if (!profile || profile.walletBalance <= 0 || !wthStartTime) {
      return [];
    }
    const elapsedMs = tickTime - wthStartTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const totalSentSoFar = Math.min(15, elapsedMinutes + 1);

    const allWiths = allPreloaded.filter(t => t.type === 'withdraw');
    const sentWithdrawals = allWiths.slice(0, totalSentSoFar);
    return sentWithdrawals.filter(t => !processedTxIds.has(t.id));
  };

  const visiblePendingWithdrawals = getVisiblePendingWithdrawals();
  const elapsedMs = wthStartTime ? tickTime - wthStartTime : 0;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const totalSentSoFar = wthStartTime ? Math.min(15, elapsedMinutes + 1) : 0;
  const nextReqInSec = wthStartTime && totalSentSoFar < 15 ? 60 - Math.floor((elapsedMs % 60000) / 1000) : 0;
  const totalLockedWithdrawalsCount = 0; // all are queueable, but locked sequentially in the UI

  // Combine visible pending items - show at most 5 at a time
  const visiblePendingRequests = [...visiblePendingDeposits, ...visiblePendingWithdrawals].slice(0, 5);

  // Total transaction logs
  const approvedDeposits = dbTransactions.filter(t => t.type === 'deposit' && t.status === 'approved');
  const cancelledDeposits = dbTransactions.filter(t => t.type === 'deposit' && t.status === 'cancelled');
  const pendingDepositsCount = visiblePendingDeposits.length;

  const approvedWithdrawals = dbTransactions.filter(t => t.type === 'withdraw' && t.status === 'approved');
  const cancelledWithdrawals = dbTransactions.filter(t => t.type === 'withdraw' && t.status === 'cancelled');
  const pendingWithdrawalsCount = visiblePendingWithdrawals.length;

  // Trigger system notification when a new preloaded deposit request is unlocked
  useEffect(() => {
    if (profile && profile.walletBalance > 0 && visiblePendingDeposits.length > 0) {
      const firstReq = visiblePendingDeposits[0];
      // Check if we already alerted this specific request ID
      const alreadyAlerted = notifications.some(n => n.id === `alert-${firstReq.id}`);
      if (!alreadyAlerted) {
        setNotifications(prev => [
          {
            id: `alert-${firstReq.id}`,
            title: `নতুন ডিপোজিট অনুরোধ: মোবাইলঃ ${firstReq.customerPhone}, টাকার পরিমাণঃ ৳${firstReq.amount} (TxnID: ${firstReq.customerTxnId})`,
            time: 'এখন',
            read: false
          },
          ...prev
        ]);
        triggerMessage(`নতুন ডিপোজিট অনুরোধ এসেছে: ৳${firstReq.amount}`, 'info');
      }
    }
  }, [profile?.walletBalance, visiblePendingDeposits.length, profile, notifications]);

  // Trigger system notification when a new preloaded withdrawal request is unlocked
  useEffect(() => {
    if (profile && profile.walletBalance > 0 && visiblePendingWithdrawals.length > 0) {
      const firstReq = visiblePendingWithdrawals[0];
      // Check if we already alerted this specific request ID
      const alreadyAlerted = notifications.some(n => n.id === `alert-wth-${firstReq.id}`);
      if (!alreadyAlerted) {
        setNotifications(prev => [
          {
            id: `alert-wth-${firstReq.id}`,
            title: `নতুন উইথড্রয়াল অনুরোধ: মোবাইলঃ ${firstReq.customerPhone}, টাকার পরিমাণঃ ৳${firstReq.amount}`,
            time: 'এখন',
            read: false
          },
          ...prev
        ]);
        triggerMessage(`নতুন উইথড্রয়াল অনুরোধ এসেছে: ৳${firstReq.amount}`, 'info');
      }
    }
  }, [profile?.walletBalance, visiblePendingWithdrawals.length, profile, notifications]);

  // -----------------------------------------------------------------
  // BACKGROUND AUTO-APPROVER FOR AGENT REFILL (FUND REQUESTS)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || cashRequests.length === 0) return;

    const intervalRef = setInterval(() => {
      const now = Date.now();
      const pendings = cashRequests.filter(r => r.status === 'pending');
      
      pendings.forEach(async (req) => {
        const createdTime = new Date(req.createdAt).getTime();
        const secondsElapsed = Math.floor((now - createdTime) / 1000);
        // Fallback delay 45s if not defined
        const delayLimit = req.autoApproveDelay || 45;

        if (secondsElapsed >= delayLimit) {
          try {
            await handleAdminApproveCashRefill(req);
            
            setNotifications(prev => [
              {
                id: `refill-auto-${req.id}`,
                title: `ওয়ালেট রিফিল সফল: ৳${req.amountBdt} আপনার ব্যালেন্সে যোগ হয়েছে!`,
                time: 'এখন',
                read: false
              },
              ...prev
            ]);
            triggerMessage(`আপনার রিফিল অনুরোধ (${req.id}) ৳${req.amountBdt} সফলভাবে অটো-এপ্রুভ করা হয়েছে!`, 'success');
          } catch (err: any) {
            console.error("Auto refill approval error:", err);
          }
        }
      });
    }, 1500);

    return () => clearInterval(intervalRef);
  }, [currentUser, cashRequests]);

  // -----------------------------------------------------------------
  // TRANSACTION ACTION HANDLERS WITH SECURE FIRESTORE TRANSACTIONS
  // -----------------------------------------------------------------
  
  // Approve a Programmatic simulated Request from the dashboard
  const handleApprovePreloaded = async (item: TransactionRecord) => {
    if (!currentUser || !profile) return;
    
    // Check constraints
    if (item.type === 'deposit' && profile.walletBalance < item.amount) {
      triggerMessage(`দুঃখিত! এই ডিপোজিটটি এপ্রুভ করার জন্য আপনার ওয়ালেটে নূন্যতম ৳${item.amount} ব্যালেন্স থাকতে হবে। এজেন্ট ক্যাশ রিফিল করুন।`, 'error');
      return;
    }

    try {
      const agentRef = doc(db, 'agents', currentUser.uid);
      const transactionRef = doc(db, 'transactions', item.id);

      // Run Firestore Transaction to guarantee atomic balances update
      await runTransaction(db, async (txn) => {
        const agentDoc = await txn.get(agentRef);
        if (!agentDoc.exists()) throw new Error('Agent document does not exist!');
        
        const agentData = agentDoc.data() as AgentProfile;
        
        // Calculate adjustments
        let newWalletBalance = agentData.walletBalance;
        let newCommissionBalance = agentData.commissionBalance;
        const commission = item.commissionEarned;

        if (item.type === 'deposit') {
          if (newWalletBalance < item.amount) {
            throw new Error('Insufficient wallet balance');
          }
          newWalletBalance -= item.amount;
          newCommissionBalance += commission;
        } else {
          // Withdrawal adds virtual money to wallet and gives physical cash
          newWalletBalance += item.amount;
          newCommissionBalance += commission;
        }

        // Stats accumulation
        const newTodayEarnings = agentData.todayEarnings + commission;
        const newMonthlyEarnings = agentData.monthlyEarnings + commission;
        const newTotalEarnings = agentData.totalEarnings + commission;
        const newCount = agentData.todayTransactionsCount + 1;

        // Write changes
        txn.set(transactionRef, {
          ...item,
          status: 'approved',
          createdAt: new Date().toISOString()
        });

        txn.update(agentRef, {
          walletBalance: newWalletBalance,
          commissionBalance: newCommissionBalance,
          todayEarnings: newTodayEarnings,
          todayTransactionsCount: newCount,
          monthlyEarnings: newMonthlyEarnings,
          totalEarnings: newTotalEarnings
        });
      });

      // Show receipt popup
      const updatedTxn: TransactionRecord = {
        ...item,
        status: 'approved',
        createdAt: new Date().toISOString()
      };
      setShowReceipt(updatedTxn);

      // Add to dynamic notifications feed
      setNotifications(prev => [
        {
          id: String(Date.now()),
          title: `৳${item.amount} এর ${item.type === 'deposit' ? 'ডিপোজিট' : 'উইথড্র'} এপ্রুভ হয়েছে এবং ৳${item.commissionEarned} কমিশন যোগ হয়েছে।`,
          time: 'এখন',
          read: false
        },
        ...prev
      ]);
      triggerMessage('লেনদেনটি সফলভাবে এপ্রুভ করা হয়েছে!', 'success');

    } catch (err: any) {
      console.error(err);
      triggerMessage('লেনদেন প্রক্রিয়াকরণ ব্যর্থ হয়েছে: ' + err.message, 'error');
    }
  };

  // Cancel a programmatic request from the queue
  const handleCancelPreloaded = async (item: TransactionRecord, reason?: string) => {
    if (!currentUser) return;
    try {
      const transactionRef = doc(db, 'transactions', item.id);
      await setDoc(transactionRef, {
        ...item,
        status: 'cancelled',
        cancelReason: reason || 'গ্রাহকের তথ্য সঠিক নয়',
        createdAt: new Date().toISOString()
      });
      triggerMessage('লেনদেনটি সফলভাবে বাতিল বা রিজেক্ট করা হয়েছে।', 'info');
    } catch (err: any) {
      triggerMessage('বাতিলকরণ ব্যর্থ হয়েছে: ' + err.message, 'error');
    }
  };

  // Completely delete a pending transaction request permanently
  const handleDeletePreloaded = async (item: TransactionRecord) => {
    if (!currentUser) return;
    try {
      const transactionRef = doc(db, 'transactions', item.id);
      await setDoc(transactionRef, {
        ...item,
        status: 'cancelled',
        cancelReason: 'এজেন্ট দ্বারা মুছে ফেলা হয়েছে (Deleted)',
        createdAt: new Date().toISOString()
      });
      triggerMessage('লেনদেন অনুরোধটি সফলভাবে ডিলেট বা মুছে ফেলা হয়েছে।', 'success');
    } catch (err: any) {
      triggerMessage('মুছে ফেলা ব্যর্থ হয়েছে: ' + err.message, 'error');
    }
  };

  // Delete a logged/approved transaction record from database
  const handleDeleteDatabaseTransaction = async (e: React.MouseEvent, logId: string) => {
    e.stopPropagation(); // Prevent trigger modal / navigation click
    if (!currentUser) return;
    try {
      const transactionRef = doc(db, 'transactions', logId);
      await deleteDoc(transactionRef);
      triggerMessage('লেনদেন রেকর্ডটি সফলভাবে ডেটাবেজ থেকে ডিলেট করা হয়েছে।', 'success');
    } catch (err: any) {
      triggerMessage('রেকর্ড ডিলেট ব্যর্থ হয়েছে: ' + err.message, 'error');
    }
  };

  // Upload and handle profile picture (Avatar) change saved to custom Agent Profile
  const handleProfileAvatarChange = async (file: File) => {
    if (!currentUser) return;
    
    // Check file size (limit to 300KB to prevent exceeding Firestore document payload of 1MB)
    if (file.size > 300 * 1024) {
      triggerMessage('ছবি সাইজ ৩০০ KB বা তার কম হতে হবে!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const userRef = doc(db, 'agents', currentUser.uid);
        await updateDoc(userRef, {
          avatarUrl: base64String
        });
        triggerMessage('প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!', 'success');
      } catch (err: any) {
        triggerMessage('ছবি পরিবর্তন ব্যর্থ হয়েছে: ' + err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Manual Cash In (Deposit) - earns 5% commission
  const handleManualCashInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;
    
    const numAmount = Number(amount);
    if (!customerPhone || isNaN(numAmount) || numAmount <= 0) {
      triggerMessage('সঠিক মোবাইল নম্বর এবং টাকার পরিমাণ দিন।', 'error');
      return;
    }

    if (profile.walletBalance < numAmount) {
      triggerMessage(`আপনার ওয়ালেট ব্যালেন্স অপর্যাপ্ত! ক্যাশ-ইন করতে নূন্যতম ৳${numAmount} প্রয়োজন।`, 'error');
      return;
    }

    const commission = Math.round(numAmount * 0.05 * 100) / 100; // 5% BDT commission
    const txnId = `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      const agentRef = doc(db, 'agents', currentUser.uid);
      const transactionRef = doc(db, 'transactions', txnId);

      await runTransaction(db, async (txn) => {
        const agentDoc = await txn.get(agentRef);
        const data = agentDoc.data() as AgentProfile;
        
        const newWallet = data.walletBalance - numAmount;
        const newComm = data.commissionBalance + commission;

        txn.set(transactionRef, {
          id: txnId,
          agentId: currentUser.uid,
          type: 'deposit',
          customerPhone,
          amount: numAmount,
          commissionEarned: commission,
          status: 'approved',
          details: 'এজেন্ট ম্যানুয়াল ক্যাশ-ইন (Deposit)',
          createdAt: new Date().toISOString()
        } as TransactionRecord);

        txn.update(agentRef, {
          walletBalance: newWallet,
          commissionBalance: newComm,
          todayEarnings: data.todayEarnings + commission,
          monthlyEarnings: data.monthlyEarnings + commission,
          totalEarnings: data.totalEarnings + commission,
          todayTransactionsCount: data.todayTransactionsCount + 1
        });
      });

      const receiptTxn: TransactionRecord = {
        id: txnId,
        agentId: currentUser.uid,
        type: 'deposit',
        customerPhone,
        amount: numAmount,
        commissionEarned: commission,
        status: 'approved',
        details: 'এজেন্ট ম্যানুয়াল ক্যাশ-ইন (Deposit)',
        createdAt: new Date().toISOString()
      };

      setShowReceipt(receiptTxn);
      setCustomerPhone('');
      setAmount('');
      setActiveFeature('none');
      triggerMessage('ম্যানুয়াল ক্যাশ-ইন সম্পন্ন হয়েছে!', 'success');
    } catch (err: any) {
      triggerMessage('ক্যাশ-ইন প্রক্রিয়াকরণ ত্রুটি: ' + err.message, 'error');
    }
  };

  // Submit Manual Cash Out (Withdraw) - earns 3% commission
  const handleManualCashOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;

    const numAmount = Number(amount);
    if (!customerPhone || isNaN(numAmount) || numAmount <= 0) {
      triggerMessage('সঠিক মোবাইল নম্বর এবং টাকার পরিমাণ দিন।', 'error');
      return;
    }

    const commission = Math.round(numAmount * 0.03 * 100) / 100; // 3% commission
    const txnId = `WTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      const agentRef = doc(db, 'agents', currentUser.uid);
      const transactionRef = doc(db, 'transactions', txnId);

      await runTransaction(db, async (txn) => {
        const agentDoc = await txn.get(agentRef);
        const data = agentDoc.data() as AgentProfile;

        // Cash out increases our digital agent wallet balance (we receive cash)
        const newWallet = data.walletBalance + numAmount;
        const newComm = data.commissionBalance + commission;

        txn.set(transactionRef, {
          id: txnId,
          agentId: currentUser.uid,
          type: 'withdraw',
          customerPhone,
          amount: numAmount,
          commissionEarned: commission,
          status: 'approved',
          details: 'এজেন্ট ম্যানুয়াল ক্যাশ-আউট (Withdraw)',
          createdAt: new Date().toISOString()
        } as TransactionRecord);

        txn.update(agentRef, {
          walletBalance: newWallet,
          commissionBalance: newComm,
          todayEarnings: data.todayEarnings + commission,
          monthlyEarnings: data.monthlyEarnings + commission,
          totalEarnings: data.totalEarnings + commission,
          todayTransactionsCount: data.todayTransactionsCount + 1
        });
      });

      const receiptTxn: TransactionRecord = {
        id: txnId,
        agentId: currentUser.uid,
        type: 'withdraw',
        customerPhone,
        amount: numAmount,
        commissionEarned: commission,
        status: 'approved',
        details: 'এজেন্ট ম্যানুয়াল ক্যাশ-আউট (Withdraw)',
        createdAt: new Date().toISOString()
      };

      setShowReceipt(receiptTxn);
      setCustomerPhone('');
      setAmount('');
      setActiveFeature('none');
      triggerMessage('ম্যানুয়াল ক্যাশ-আউট সফল হয়েছে!', 'success');
    } catch (err: any) {
      triggerMessage('ক্যাশ-আউট বুকিং ত্রুটি: ' + err.message, 'error');
    }
  };

  // Submit Mobile Recharge - subtracts from wallet balance (no commission mentioned for recharge)
  const handleMobileRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;

    const numAmount = Number(amount);
    if (!customerPhone || isNaN(numAmount) || numAmount <= 0) {
      triggerMessage('সঠিক মোবাইল নম্বর এবং রিচার্জ পরিমাণ দিন।', 'error');
      return;
    }

    if (profile.walletBalance < numAmount) {
      triggerMessage(`আপনার এজেন্ট ওয়ালেট ব্যালেন্স অপর্যাপ্ত! রিচার্জ করতে নূন্যতম ৳${numAmount} প্রয়োজন।`, 'error');
      return;
    }

    const txnId = `REC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      const agentRef = doc(db, 'agents', currentUser.uid);
      const transactionRef = doc(db, 'transactions', txnId);

      await runTransaction(db, async (txn) => {
        const agentDoc = await txn.get(agentRef);
        const data = agentDoc.data() as AgentProfile;

        const newWallet = data.walletBalance - numAmount;

        txn.set(transactionRef, {
          id: txnId,
          agentId: currentUser.uid,
          type: 'recharge',
          customerPhone,
          amount: numAmount,
          commissionEarned: 0,
          status: 'approved',
          details: `${rechargeOperator} রিচার্জ সফল`,
          createdAt: new Date().toISOString()
        } as TransactionRecord);

        txn.update(agentRef, {
          walletBalance: newWallet,
          todayTransactionsCount: data.todayTransactionsCount + 1
        });
      });

      const receiptTxn: TransactionRecord = {
        id: txnId,
        agentId: currentUser.uid,
        type: 'recharge',
        customerPhone,
        amount: numAmount,
        commissionEarned: 0,
        status: 'approved',
        details: `${rechargeOperator} মোবাইল রিচার্জ`,
        createdAt: new Date().toISOString()
      };

      setShowReceipt(receiptTxn);
      setCustomerPhone('');
      setAmount('');
      setActiveFeature('none');
      triggerMessage('মোবাইল রিচার্জ সফলভাবে সম্পন্ন হয়েছে!', 'success');
    } catch (err: any) {
      triggerMessage('রিচার্জ প্রক্রিয়াকরণে সমস্যা: ' + err.message, 'error');
    }
  };

  // Submit Bill Payment - subtracts from wallet balance
  const handleBillPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;

    const numAmount = Number(amount);
    if (!billMeterNo || isNaN(numAmount) || numAmount <= 0) {
      triggerMessage('সঠিক গ্রাহক মিটার এবং বিলের পরিমাণ দিন।', 'error');
      return;
    }

    if (profile.walletBalance < numAmount) {
      triggerMessage(`রিসোর্স ব্যালেন্স অপর্যাপ্ত! বিদ্যুৎ বা অনলাইন বিল পরিশোধের জন্য নূন্যতম ৳${numAmount} প্রয়োজন।`, 'error');
      return;
    }

    const txnId = `BIL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      const agentRef = doc(db, 'agents', currentUser.uid);
      const transactionRef = doc(db, 'transactions', txnId);

      await runTransaction(db, async (txn) => {
        const agentDoc = await txn.get(agentRef);
        const data = agentDoc.data() as AgentProfile;

        const newWallet = data.walletBalance - numAmount;

        txn.set(transactionRef, {
          id: txnId,
          agentId: currentUser.uid,
          type: 'bill_pay',
          customerPhone: billMeterNo,
          amount: numAmount,
          commissionEarned: 0,
          status: 'approved',
          details: `${billerName} বিল পেমেন্ট`,
          createdAt: new Date().toISOString()
        } as TransactionRecord);

        txn.update(agentRef, {
          walletBalance: newWallet,
          todayTransactionsCount: data.todayTransactionsCount + 1
        });
      });

      const receiptTxn: TransactionRecord = {
        id: txnId,
        agentId: currentUser.uid,
        type: 'bill_pay',
        customerPhone: billMeterNo,
        amount: numAmount,
        commissionEarned: 0,
        status: 'approved',
        details: `${billerName} পরিশোধ করা হয়েছে`,
        createdAt: new Date().toISOString()
      };

      setShowReceipt(receiptTxn);
      setBillMeterNo('');
      setAmount('');
      setActiveFeature('none');
      triggerMessage('অনলাইন বিল পেমেন্ট সফল হয়েছে!', 'success');
    } catch (err: any) {
      triggerMessage('বিল পেমেন্ট ত্রুটি: ' + err.message, 'error');
    }
  };

  // Submit Agent Cash (Agent Top Up Request) - Min $10 (1200 BDT)
  const handleAgentCashRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;

    const bdtAmount = Number(agentCashAmount);
    if (isNaN(bdtAmount) || bdtAmount < 1200) {
      triggerMessage('নূন্যতম রিফিল ১০$ সমপরিমাণ ১২০০ টাকা (1200 BDT) হতে হবে!', 'error');
      return;
    }

    if (!agentCashSenderPhone || agentCashSenderPhone.length < 11) {
      triggerMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।', 'error');
      return;
    }

    if (!agentCashTxnId) {
      triggerMessage('বিকাশ বা নগদ ট্রানজেকশন আইডি (TxnID) দিন।', 'error');
      return;
    }

    const requestId = `CASH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const cleanScreenshot = screenshotFileBase64 || screenshotUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=200&auto=format&fit=crop';
    
    // Choose a random auto-approve delay between 30 to 60 seconds
    const randomDelay = Math.floor(Math.random() * 31) + 30; // 30 to 60 seconds

    try {
      const newRequest: AgentCashRequest = {
        id: requestId,
        agentId: currentUser.uid,
        agentName: profile.name,
        amountBdt: bdtAmount,
        paymentMethod: agentCashMethod,
        transactionId: agentCashTxnId,
        senderPhone: agentCashSenderPhone,
        autoApproveDelay: randomDelay,
        screenshotUrl: cleanScreenshot,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'agentCashRequests', requestId), newRequest);
      
      setAgentCashAmount('');
      setAgentCashSenderPhone('');
      setAgentCashTxnId('');
      setScreenshotUrl('');
      setScreenshotFileName('');
      setScreenshotFileBase64('');
      
      setActiveFeature('none');
      triggerMessage('আপনার রিফিল আবেদন জমা হয়েছে! এটি ৩০ সেকেন্ড থেকে ১ মিনিটের মধ্যে অটো এপ্রুভ হয়ে যাবে।', 'success');
    } catch (err: any) {
      triggerMessage('রিকোয়েস্ট জমা ত্রুটি: ' + err.message, 'error');
    }
  };

  // Submit Agent Withdraw (Commission Cash Out)
  const handleAgentWithdrawRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;

    const bdtAmount = Number(withdrawAmount);
    if (isNaN(bdtAmount) || bdtAmount <= 0) {
      triggerMessage('সঠিক টাকা পরিমাণ দিন।', 'error');
      return;
    }

    if (!withdrawNumber || withdrawNumber.length < 11) {
      triggerMessage('গ্রাহক পেমেন্ট নম্বরটি সঠিকভাবে পূরণ করুন।', 'error');
      return;
    }

    if (withdrawSource === 'commission') {
      if (profile.commissionBalance < bdtAmount) {
        triggerMessage(`আপনার কমিশন ব্যালেন্স অপর্যাপ্ত! সর্বোচ্চ ৳${profile.commissionBalance} উত্তোলন সম্ভব।`, 'error');
        return;
      }
    } else {
      if (profile.walletBalance < bdtAmount) {
        triggerMessage(`আপনার মূল ওয়ালেট ব্যালেন্স অপর্যাপ্ত! সর্বোচ্চ ৳${profile.walletBalance} উত্তোলন সম্ভব।`, 'error');
        return;
      }
    }

    const requestId = `WDR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      const agentRef = doc(db, 'agents', currentUser.uid);
      const withdrawRef = doc(db, 'agentWithdrawRequests', requestId);

      await runTransaction(db, async (txn) => {
        const agentDoc = await txn.get(agentRef);
        const data = agentDoc.data() as AgentProfile;

        if (withdrawSource === 'commission') {
          if (data.commissionBalance < bdtAmount) {
            throw new Error('Insufficient commission balance');
          }
          const newComm = data.commissionBalance - bdtAmount;
          txn.update(agentRef, {
            commissionBalance: newComm
          });
        } else {
          if (data.walletBalance < bdtAmount) {
            throw new Error('Insufficient wallet balance');
          }
          const newWallet = data.walletBalance - bdtAmount;
          txn.update(agentRef, {
            walletBalance: newWallet
          });
        }

        // Add request log
        txn.set(withdrawRef, {
          id: requestId,
          agentId: currentUser.uid,
          agentName: data.name,
          amountBdt: bdtAmount,
          paymentMethod: withdrawMethod,
          paymentNumber: withdrawNumber,
          status: 'pending',
          withdrawSource,
          createdAt: new Date().toISOString()
        } as AgentWithdrawRequest);
      });

      setWithdrawAmount('');
      setWithdrawNumber('');
      setActiveFeature('none');
      triggerMessage(
        withdrawSource === 'commission'
          ? 'কমিশন উত্তোলনের আবেদন সফলভাবে সাবমিট হয়েছে!'
          : 'মূল ওয়ালেট থেকে উত্তোলনের আবেদন সফলভাবে সাবমিট হয়েছে!',
        'success'
      );
    } catch (err: any) {
      triggerMessage('আবেদন সাবমিট সমস্যা: ' + err.message, 'error');
    }
  };

  // -----------------------------------------------------------------
  // ADMIN FUNCTIONS (Only for bdwalletagent@gmail.com / role === 'admin')
  // -----------------------------------------------------------------
  const handleAdminApproveCashRefill = async (request: AgentCashRequest) => {
    try {
      const requestRef = doc(db, 'agentCashRequests', request.id);
      const agentProfileRef = doc(db, 'agents', request.agentId);

      await runTransaction(db, async (txn) => {
        const reqDoc = await txn.get(requestRef);
        if (!reqDoc.exists() || reqDoc.data().status !== 'pending') {
          throw new Error('Request already processed or not found');
        }

        const agentSnap = await txn.get(agentProfileRef);
        if (!agentSnap.exists()) throw new Error('Agent profile not found');
        
        const agentData = agentSnap.data() as AgentProfile;
        const currentWallet = agentData.walletBalance || 0;
        const updatedWallet = currentWallet + request.amountBdt;

        // Mark Cash load request approved
        txn.update(requestRef, { status: 'approved' });

        // Credit Agent Digital Wallet
        txn.update(agentProfileRef, {
          walletBalance: updatedWallet
        });

        // Register custom approved credit transaction log
        const logId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
        const refLogRef = doc(db, 'transactions', logId);
        txn.set(refLogRef, {
          id: logId,
          agentId: request.agentId,
          type: 'deposit',
          customerPhone: 'ADMIN LOAD',
          amount: request.amountBdt,
          commissionEarned: 0,
          status: 'approved',
          details: `এডমিন কর্তৃক রিফিল এপ্রুভ (${request.paymentMethod})`,
          createdAt: new Date().toISOString()
        } as TransactionRecord);
      });

      triggerMessage(`সফলভাবে এজেন্ট ${request.agentName}-এর ৳${request.amountBdt} রিফিল এপ্রুভ করা হয়েছে!`, 'success');
    } catch (err: any) {
      triggerMessage('অপারেশন ব্যর্থ: ' + err.message, 'error');
    }
  };

  const handleAdminRejectCashRefill = async (request: AgentCashRequest) => {
    try {
      await updateDoc(doc(db, 'agentCashRequests', request.id), {
        status: 'rejected'
      });
      triggerMessage('রিফিল আবেদন প্রত্যাখ্যাত হয়েছে।', 'info');
    } catch (err: any) {
      triggerMessage('অপারেশন ব্যর্থ হয়েছে: ' + err.message, 'error');
    }
  };

  const handleAdminApprovePayout = async (request: AgentWithdrawRequest) => {
    try {
      await updateDoc(doc(db, 'agentWithdrawRequests', request.id), {
        status: 'approved'
      });
      triggerMessage(`গ্রাহক/${request.agentName} এর কমিশন পেআউট ৳${request.amountBdt} এপ্রুভ করা হয়েছে।`, 'success');
    } catch (err: any) {
      triggerMessage('ত্রুটি: ' + err.message, 'error');
    }
  };

  const handleAdminRejectPayout = async (request: AgentWithdrawRequest) => {
    try {
      const requestRef = doc(db, 'agentWithdrawRequests', request.id);
      const agentProfileRef = doc(db, 'agents', request.agentId);

      await runTransaction(db, async (txn) => {
        const reqDoc = await txn.get(requestRef);
        if (!reqDoc.exists() || reqDoc.data().status !== 'pending') {
          throw new Error('Payout request not found or not pending');
        }

        const agentSnap = await txn.get(agentProfileRef);
        const agentData = agentSnap.data() as AgentProfile;

        txn.update(requestRef, { status: 'rejected' });

        if (request.withdrawSource === 'wallet') {
          const refundedWallet = (agentData.walletBalance || 0) + request.amountBdt;
          txn.update(agentProfileRef, { walletBalance: refundedWallet });
        } else {
          const refundedComm = (agentData.commissionBalance || 0) + request.amountBdt;
          txn.update(agentProfileRef, { commissionBalance: refundedComm });
        }
      });

      triggerMessage('পেআউট রিজেক্ট এবং সঠিক ব্যালেন্সে রিফান্ড করা হয়েছে।', 'info');
    } catch (err: any) {
      triggerMessage('ত্রুটি: ' + err.message, 'error');
    }
  };

  return (
    <PhoneFrame>
      {/* Absolute floating notifications popup banner */}
      {infoMessage.text && (
        <div className={`absolute top-12 left-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-start gap-2.5 transition-all animate-bounce ${
          infoMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-l-4 border-rose-500' : 
          infoMessage.type === 'info' ? 'bg-sky-50 text-sky-800 border-l-4 border-sky-500' :
          'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500'
        } text-xs font-semibold`}>
          <Info className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span className="block font-bold">{infoMessage.type === 'error' ? 'সতর্কবার্তা / Error' : infoMessage.type === 'info' ? 'তথ্য / Info' : 'সফল হয়েছে / Success'}</span>
            <p className="mt-0.5 leading-relaxed">{infoMessage.text}</p>
          </div>
          <button onClick={() => setInfoMessage({ text: '', type: 'success' })} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO AUTH STATE */}
      {!currentUser ? (
        /* ==================== LOGIN/REGISTRATION SCREEN ==================== */
        <div className="flex-1 bg-slate-50 flex flex-col justify-center px-6 py-8 relative">
          
          {/* Decorative Logo branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E2125B] text-white rounded-[24px] shadow-lg shadow-rose-200 mb-3 font-display">
              <Coins className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display">E-Wallet Agent</h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-mono">Digital Banking Hub</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col">
            <div className="flex border-b border-slate-100 mb-5 text-center">
              <button 
                onClick={() => { setViewState('login'); setAuthError(''); }}
                className={`flex-1 pb-3 text-sm font-bold ${viewState === 'login' ? 'text-[#E2125B] border-b-2 border-[#E2125B]' : 'text-slate-400'}`}
              >
                এজেন্ট লগইন (Login)
              </button>
              <button 
                onClick={() => { setViewState('register'); setAuthError(''); }}
                className={`flex-1 pb-3 text-sm font-bold ${viewState === 'register' ? 'text-[#E2125B] border-b-2 border-[#E2125B]' : 'text-slate-400'}`}
              >
                নতুন রেজিস্ট্রেশন (Register)
              </button>
            </div>

            {authError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl mb-4 font-medium border border-rose-100 leading-relaxed text-left">
                {authError}
              </div>
            )}

            {viewState === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">ইমেইল ঠিকানা (Agent Email)</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="agent@example.com"
                    className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">পাসওয়ার্ড (Password)</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full mt-2 py-3 rounded-xl bg-[#E2125B] hover:bg-rose-600 text-white font-bold text-sm transition-all shadow-md shadow-rose-200/50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? 'অনুগ্রহ করে অপেক্ষা করুন...' : 'লগইন করুন (Sign In)'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">এজেন্ট সম্পূর্ণ নাম (Name)</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="উদাঃ রকিবুল হাসান"
                    className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">মোবাইল নম্বর (Phone)</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="017XXXXXXXX"
                    className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">ইমেল এড্রেস (Email Address)</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="agent@example.com"
                    className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">গোপন পাসওয়ার্ড (Choose Password)</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="নূন্যতম ৬ অক্ষর"
                    className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full mt-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? 'অপেক্ষা করুন...' : 'একাউন্ট তৈরি করুন (Register)'}
                </button>
              </form>
            )}

            {/* Quick Demo Test Logins */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2 text-center">ডেভেলপার ডেমো টেস্টিং লগইন</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleDemoLogin('agent')}
                  className="py-2 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] transition-colors cursor-pointer flex flex-col items-center"
                >
                  <span>Quick Test Agent</span>
                  <span className="text-[8px] font-normal leading-none mt-0.5 mt-0.5 opacity-80">(0 Demo Balance)</span>
                </button>
                <button 
                  onClick={() => handleDemoLogin('admin')}
                  className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] transition-colors cursor-pointer flex flex-col items-center"
                >
                  <span>Quick Test SuperAdmin</span>
                  <span className="text-[8px] font-normal leading-none mt-0.5 opacity-80">(bdwalletagent@gmail)</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-4 leading-normal text-center">
              নিবন্ধন করলে আপনার ওয়ালেটে ডেমো ব্যালেন্স বা রিফান্ড হিসেবে <strong>কোনো ব্যালেন্স থাকবে না</strong>। ক্যাশ-ইন আবেদন প্রসেস করে ব্যালেন্স যুক্ত করুন।
            </div>

          </div>

        </div>
      ) : (
        /* ==================== SECURE AUTHENTICATED WORKSPACE ==================== */
        <div className="flex-1 flex flex-col relative w-full h-full bg-slate-50">
          
          {/* App Header */}
          <div className="bg-white border-b border-slate-100 px-4 py-3 select-none flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {/* Profile Bubble Avatar with Photo Upload support */}
              <div className="relative group">
                <input 
                  type="file" 
                  id="header-avatar-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProfileAvatarChange(file);
                  }}
                />
                <button 
                  onClick={() => document.getElementById('header-avatar-upload')?.click()}
                  className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-rose-100 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer relative flex items-center justify-center shrink-0"
                  title="প্রোফাইল ছবি পরিবর্তন করতে ক্লিক করুন"
                >
                  {profile?.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile?.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#E2125B] text-white flex items-center justify-center font-extrabold text-xs">
                      {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'AG'}
                    </div>
                  )}
                  {/* Small camera overlay indicator on hover */}
                  <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </button>
              </div>

              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 leading-none uppercase select-none tracking-wide">
                  {profile?.role === 'admin' ? 'সুপার এডমিন প্যানেল' : 'ভেরিফাইড এজেন্ট'}
                </span>
                <h4 className="text-xs font-bold text-slate-800 leading-normal line-clamp-1">{profile?.name || 'এজেন্ট ইউজার'}</h4>
              </div>
            </div>

            {/* Quick action bar control */}
            <div className="flex items-center gap-2">
              {/* Switch dashboard to admin mode toggle if user email is bdwalletagent@gmail.com */}
              {profile?.role === 'admin' && (
                <button 
                  onClick={() => {
                    if (activeFeature === 'admin_dashboard') {
                      setActiveFeature('none');
                    } else {
                      setActiveFeature('admin_dashboard');
                    }
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 select-none cursor-pointer ${
                    activeFeature === 'admin_dashboard' 
                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>{activeFeature === 'admin_dashboard' ? 'এজেন্ট মোড' : 'এডমিন ভিউ'}</span>
                </button>
              )}

              {/* Notification bell */}
              <div className="relative shrink-0">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer select-none"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#E2125B] rounded-full animate-ping"></span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 bg-white rounded-2xl w-64 shadow-xl border border-slate-100 p-3 z-50 text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[11px] font-bold text-slate-700">নোটিফিকেশনসমূহ</span>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          setShowNotifications(false);
                        }}
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        সব পঠিত করুন
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-slate-400 py-3 text-center">কোনো নোটিফিকেশন নেই।</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                        {notifications.map(n => (
                          <div key={n.id} className="p-2 hover:bg-slate-50 rounded-xl leading-normal text-[10px] text-slate-600 border-b border-slate-50">
                            <span className="text-slate-400 text-[8px] float-right">{n.time}</span>
                            <div className="font-semibold text-slate-800">{n.title}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Home button key */}
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer select-none"
                title="Log Out From Agent"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MAIN CONTAINER (SLITS DESIGN) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-16">
            
            {/* CORE APP WRAPPER LAYOUT ROUTER */}
            {activeFeature === 'none' && currentTab === 'dashboard' && (
              <>
                {/* -------------------- AGENT CORE BALANCE CARD -------------------- */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  
                  {/* Digital Wallet Balance box */}
                  <div className="bg-gradient-to-br from-indigo-700 to-blue-600 rounded-3xl p-4 text-white text-left shadow-md flex flex-col justify-between relative overflow-hidden select-none min-h-[110px]">
                    <div className="z-10">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-100 block">Wallet Balance</span>
                      {/* Tap to Toggle Shutter */}
                      <button 
                        onClick={() => setShowWalletBalance(!showWalletBalance)}
                        className="mt-1 flex items-center justify-start gap-1 cursor-pointer"
                      >
                        {showWalletBalance ? (
                          <span className="text-2xl font-black font-mono">৳{profile?.walletBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="bg-white/20 h-7 w-28 rounded-md block shimmer-bg border border-white/10 flex items-center justify-center text-[10px] font-bold text-indigo-100">ট্যাপ করে ব্যালেন্স দেখুন</span>
                        )}
                      </button>
                    </div>
                    <p className="text-[8px] text-indigo-200 mt-2 z-10 font-medium">ক্যাশ ইন লেনদেনে ব্যবহৃত হবে</p>
                    <div className="absolute right-2 bottom-2 opacity-15">
                      <Coins className="w-12 h-12" />
                    </div>
                  </div>

                  {/* Commission Balance box */}
                  <div className="bg-gradient-to-br from-rose-600 to-rose-500 rounded-3xl p-4 text-white text-left shadow-md flex flex-col justify-between relative overflow-hidden select-none min-h-[110px]">
                    <div className="z-10">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#FFF] opacity-80 block">Commission Balance</span>
                      {/* Tap to Toggle Shutter */}
                      <button 
                        onClick={() => setShowCommBalance(!showCommBalance)}
                        className="mt-1 flex items-center justify-start gap-1 cursor-pointer"
                      >
                        {showCommBalance ? (
                          <span className="text-xl font-bold font-mono">৳{profile?.commissionBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="bg-white/20 h-7 w-28 rounded-md block shimmer-bg border border-white/10 flex items-center justify-center text-[10px] font-bold text-rose-100">ট্যাপ করে কমিশন দেখুন</span>
                        )}
                      </button>
                    </div>
                    <button 
                      onClick={() => setActiveFeature('agent_withdraw')}
                      className="mt-2 py-1 px-3 bg-white text-rose-600 font-bold text-[9px] rounded-lg tracking-normal cursor-pointer hover:bg-rose-50 transition-colors z-10 text-center self-start"
                    >
                      উত্তোলন করুন (Cash Out)
                    </button>
                    <div className="absolute right-2 bottom-2 opacity-15">
                      <TrendingUp className="w-12 h-12" />
                    </div>
                  </div>

                </div>

                {/* -------------------- STATS COUNTERS BAR -------------------- */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white rounded-2xl p-3 border border-slate-100 text-left border-l-4 border-l-indigo-600">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">আজকের লেনদেন</span>
                    <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">{profile?.todayTransactionsCount || 0} টি</span>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-slate-100 text-left border-l-4 border-l-emerald-500">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">আজকের মোট আয়</span>
                    <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">৳{profile?.todayEarnings || 0}</span>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-slate-100 text-left border-l-4 border-l-violet-500">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">চলতি মাসের লাভ</span>
                    <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">৳{profile?.monthlyEarnings || 0}</span>
                  </div>
                </div>

                {/* -------------------- MAIN QUICK FEATURES GRID -------------------- */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">এজেন্ট কুইক মেনু (Quick Actions)</h3>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">সার্ভিস প্যানেল</span>
                  </div>

                  <div className="grid grid-cols-4 gap-y-5 gap-x-2">
                    
                    {/* Cash In button */}
                    <button 
                      onClick={() => setActiveFeature('cash_in')}
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-[16px] bg-[#E2125B]/5 hover:bg-[#E2125B]/10 text-[#E2125B] flex items-center justify-center transition-transform active:scale-95 shadow-sm">
                        <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">ক্যাশ ইন</span>
                    </button>

                    {/* Cash Out button */}
                    <button 
                      onClick={() => setActiveFeature('cash_out')}
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-[16px] bg-[#E2125B]/5 hover:bg-[#E2125B]/10 text-[#E2125B] flex items-center justify-center transition-transform active:scale-95 shadow-sm">
                        <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">ক্যাশ আউট</span>
                    </button>

                    {/* Mobile Recharge */}
                    <button 
                      onClick={() => setActiveFeature('recharge')}
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-[16px] bg-[#E2125B]/5 hover:bg-[#E2125B]/10 text-[#E2125B] flex items-center justify-center transition-transform active:scale-95 shadow-sm">
                        <Smartphone className="w-6 h-6 stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">মোবাইল রিচার্জ</span>
                    </button>

                    {/* Bill pay */}
                    <button 
                      onClick={() => setActiveFeature('bill_pay')}
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-[16px] bg-[#E2125B]/5 hover:bg-[#E2125B]/10 text-[#E2125B] flex items-center justify-center transition-transform active:scale-95 shadow-sm">
                        <FileText className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">বিল লাইভ</span>
                    </button>

                    {/* Agent Cash Refill (৳ ১০$ বা ১২০০ টাকা) */}
                    <button 
                      onClick={() => setActiveFeature('agent_cash')}
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-[16px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center transition-transform active:scale-95 shadow-sm border border-indigo-100">
                        <Plus className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">এজেন্ট ক্যাশ</span>
                    </button>

                    {/* Agent Withdraw */}
                    <button 
                      onClick={() => setActiveFeature('agent_withdraw')}
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-[16px] bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-transform active:scale-95 shadow-sm border border-rose-100">
                        <Coins className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">কমিশন তুলুন</span>
                    </button>

                    {/* Help desk guide button */}
                    <button 
                      onClick={() => setActiveFeature('help_desk')}
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-[16px] bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-transform active:scale-95 shadow-sm">
                        <HelpCircle className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center">নির্দেশিকা</span>
                    </button>

                    {/* Telegram circular quick active channel link */}
                    <a 
                      href="https://t.me/bdwalletagent" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#229ED9] hover:bg-[#1f8ec4] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-blue-500/10">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.19 0 .27z"/>
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight text-center text-[#229ED9]">টেলিগ্রাম সাপোর্ট</span>
                    </a>

                  </div>
                </div>

                {/* -------------------- AGENT QUEUE SYSTEM (Simulated based on balance) -------------------- */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">আসন্ন গ্রাহক ট্রানজেকশন রিকোয়েস্ট ({visiblePendingRequests.length})</h3>
                      <span className="text-[9px] text-slate-400 block mt-0.5">আপনার ওয়ালেট ব্যালেন্সের অনুপাতে পেন্ডিং নোটিফিকেশন</span>
                    </div>
                    <button 
                      onClick={() => {
                        triggerMessage('লাইভ পেন্ডিং কিউ রিফ্রেশ করা হয়েছে।', 'info');
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 text-[#E2125B] transition-colors"
                      title="Refresh Queue"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </button>
                  </div>

                  {visiblePendingRequests.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-8 px-4 text-center">
                      <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-slate-700">কোনো রিকোয়েস্ট লোড হয়নি</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-xs mx-auto">
                        আপনার ক্যাশ ওয়ালেটে বর্তমানে কোনো ব্যালেন্স নেই। গ্রাহক লেনদেন রিকোয়েস্ট পেতে কমপক্ষে <strong>৳১২০০ (১০$) রিফিল করুন</strong>।
                      </p>
                      <button 
                        onClick={() => setActiveFeature('agent_cash')}
                        className="mt-3 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                      >
                        ৳১২০০ ফান্ড রিফিল করুন (Agent Cash)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="bg-amber-50 text-amber-800 text-[9px] font-semibold leading-normal p-2 rounded-xl border border-amber-100 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>১০০% বিএসডি রিয়েলটাইমPersistent ট্র্যাকিং একটিভ আছে।</span>
                      </div>
                      
                      {visiblePendingRequests.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-2.5 hover:bg-indigo-50/25 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 text-left">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              item.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                            }`}>
                              {item.type === 'deposit' ? (
                                <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                              )}
                            </div>
                            <div>
                              <span className="font-mono text-xs font-bold text-slate-800 block select-all">{item.customerPhone}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400 capitalize">{item.type === 'deposit' ? 'ক্যাশ-ইন' : 'ক্যাশ-আউট'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="bg-rose-100 text-rose-700 text-[8px] font-bold px-1 py-0.2 rounded-sm font-sans">কমিশন: +৳{item.commissionEarned}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-extrabold font-mono block ${
                              item.type === 'deposit' ? 'text-slate-800' : 'text-[#E2125B]'
                            }`}>
                              ৳{item.amount}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 justify-end">
                              <button 
                                onClick={() => handleDeletePreloaded(item)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="মুছে ফেলুন (ডিলিট)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setRejectingRequest(item)}
                                className="px-2 py-0.8 hover:bg-slate-200 bg-slate-100 rounded text-slate-600 text-[9px] font-bold cursor-pointer"
                              >
                                রিজেক্ট
                              </button>
                              <button 
                                onClick={() => handleApprovePreloaded(item)}
                                className="px-2.5 py-0.8 bg-[#E2125B] hover:bg-rose-600 text-white rounded text-[9px] font-bold shadow-xs select-none cursor-pointer"
                              >
                                এপ্রুভ
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* -------------------- RECENT TRANSACTIONS SYSTEM (Firestore Logs) -------------------- */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-800">আসন্ন / সাম্প্রতিক হিসাব লগ</h3>
                    <button 
                      onClick={() => setCurrentTab('transactions_list')}
                      className="text-[10px] font-bold text-[#E2125B] hover:underline"
                    >
                      সব দেখুন
                    </button>
                  </div>

                  {dbTransactions.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">কোনো সফল লেনদেন ইতিহাস নেই।</p>
                  ) : (
                    <div className="space-y-2.5">
                      {dbTransactions.slice(0, 5).map((log) => (
                        <div 
                          key={log.id} 
                          onClick={() => setShowReceipt(log)}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer border-b border-slate-50"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              log.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {log.type === 'deposit' ? '📥' : log.type === 'withdraw' ? '📤' : log.type === 'recharge' ? '📱' : '🧾'}
                            </div>
                            <div className="text-left leading-normal">
                              <p className="text-xs font-semibold text-slate-800">{log.customerPhone}</p>
                              <span className="text-[9px] text-slate-400 block">{log.details ?? log.type} • {new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-2">
                            <div>
                              <span className={`text-xs font-bold block ${
                                log.status === 'approved' ? 'text-emerald-600' : 'text-slate-400'
                              }`}>
                                ৳{log.amount}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                log.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {log.status === 'approved' ? 'সফল' : 'বাতিল'}
                              </span>
                            </div>
                            <button 
                              onClick={(e) => handleDeleteDatabaseTransaction(e, log.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="মুছে ফেলুন (ডিলিট)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Guide Help Cards */}
                <HelpDesk />
              </>
            )}

            {/* -------------------- INDIVIDUAL SUITE FEATURES ROUTER -------------------- */}
            
            {/* 1. CASH IN FEATURES PANEL */}
            {activeFeature === 'cash_in' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">ক্যাশ-ইন (Deposit Operations)</h3>
                    <span className="text-[10px] text-[#E2125B] block font-bold font-mono uppercase tracking-wider">Earn 5% Flat Commission</span>
                  </div>
                  <button 
                    onClick={() => setActiveFeature('none')}
                    className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Counts Status Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-sky-50 rounded-xl p-2 border border-sky-100 text-sky-800">
                    <span className="text-[9px] block text-slate-550">চলতি পেন্ডিং</span>
                    <span className="text-xs font-extrabold font-mono text-sky-900">{visiblePendingDeposits.length} টি</span>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-2 border border-rose-100 text-rose-800">
                    <span className="text-[9px] block text-slate-550">ডিপোজিট বাতিল</span>
                    <span className="text-xs font-extrabold font-mono text-rose-900">{cancelledDeposits.length} টি</span>
                  </div>
                  <div className="bg-[#E2125B]/5 rounded-xl p-2 border border-[#E2125B]/10 text-[#E2125B]">
                    <span className="text-[9px] block text-slate-550">মোট লকড</span>
                    <span className="text-xs font-extrabold font-mono">{totalLockedDepositsCount} টি</span>
                  </div>
                </div>

                {/* Options Selection Tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCashInTab('requests')}
                    className={`flex-1 pb-2 text-xs font-extrabold text-center transition-all cursor-pointer ${
                      cashInTab === 'requests' 
                        ? 'text-[#E2125B] border-b-2 border-[#E2125B]' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ১ঃ ডিপোজিট অনুরোধ সমুহ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashInTab('cancelled')}
                    className={`flex-1 pb-2 text-xs font-extrabold text-center transition-all cursor-pointer ${
                      cashInTab === 'cancelled' 
                        ? 'text-[#E2125B] border-b-2 border-[#E2125B]' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ২ঃ ডিপোজিট বাতিল ({cancelledDeposits.length})
                  </button>
                </div>

                {/* Tab 1: Deposit Requests List */}
                {cashInTab === 'requests' && (
                  <div className="space-y-3 pt-1">
                    {profile && profile.walletBalance === 0 ? (
                      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 space-y-2.5 text-xs">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-semibold">
                            আপনার এজেন্ট ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। দয়া করে ব্যালেন্স রিফিল করুন, তাহলেই নতুন কাস্টোমার ডিপোজিট অনুরোধগুলো আপনার ইনবক্স ও নোটিফিকেশনে একে একে আসতে শুরু করবে।
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveFeature('agent_cash')}
                          className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>ওয়ালেট ক্যাশ রিফিল করুন</span>
                        </button>
                      </div>
                    ) : visiblePendingDeposits.length === 0 ? (
                      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 text-indigo-900 text-center py-6 space-y-2">
                        <CheckCircle className="w-8 h-8 text-indigo-500 mx-auto" />
                        <h4 className="font-bold text-sm">কোনো ডিপোজিট অনুরোধ নেই</h4>
                        <p className="text-[10px] text-indigo-600 leading-relaxed px-2">
                          আপনার কারেন্ট ওয়ালেট ব্যালেন্স ৳{profile?.walletBalance}। নতুন কাস্টমার ডিপোজিট আসার সাথে সাথে তা আপনার নোটিফিকেশনে জানানো হবে।
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-emerald-50 rounded-xl px-3 py-1.5 border border-emerald-100 flex items-center gap-2 text-[10px] text-emerald-800 font-semibold mb-2">
                          <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-bounce" />
                          <span>সক্রিয় এবং উপযুক্ত ডিপোজিট অনুরোধসমূহ (আপনার ব্যালেন্স অনুযায়ী নির্ধারিত)</span>
                        </div>

                        {/* Rendering deposits one after another as prioritized queue */}
                        <div className="space-y-3.5">
                          {visiblePendingDeposits.map((item, index) => (
                            <div 
                              key={item.id} 
                              className={`rounded-2xl border p-4 space-y-3.5 transition-all duration-305 ${
                                index === 0 
                                  ? 'bg-gradient-to-br from-slate-50 to-white border-[#E2125B]/20 shadow-xs' 
                                  : 'bg-slate-50/60 border-slate-100 opacity-60 pointer-events-none scale-98'
                              }`}
                            >
                              {index === 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="bg-[#E2125B] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    সক্রিয় অনুরোধ (Active Request)
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 font-mono">
                                    ID: {item.id}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5 text-left">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">গ্রাহক মোবাইল নম্বর</label>
                                  <span className="font-mono text-sm font-extrabold text-slate-800 block select-all">
                                    {item.customerPhone}
                                  </span>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">ডিপোজিট পরিমাণ</label>
                                  <span className="text-base font-black text-[#E2125B] font-mono block">
                                    ৳{item.amount}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-100/70 p-3 rounded-xl flex items-center justify-between border border-slate-200/50 text-left">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">কাস্টোমার ট্রাঞ্জেকশন আইডি</span>
                                  <span className="font-mono text-xs font-black text-slate-700 block tracking-wider select-all">
                                    {item.customerTxnId}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="bg-rose-100 text-[#E2125B] text-[9px] font-bold px-2 py-0.5 rounded-xl">
                                    কমিশন: +৳{item.commissionEarned}
                                  </span>
                                </div>
                              </div>

                              {index === 0 ? (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setRejectingRequest(item)}
                                    className="w-full py-2.5 hover:bg-rose-105 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl transition-all border border-rose-200 cursor-pointer text-center"
                                  >
                                    বাতিল করুন
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApprovePreloaded(item)}
                                    className="w-full py-2.5 bg-[#E2125B] hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-200/50 cursor-pointer text-center"
                                  >
                                    এপ্রুভ করুন
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center py-1 text-[10px] text-slate-400 font-semibold">
                                  আগের অনুরোধটি সমাধান করুন...
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Cancelled Deposits List */}
                {cashInTab === 'cancelled' && (
                  <div className="space-y-3 pt-1">
                    {cancelledDeposits.length === 0 ? (
                      <div className="bg-slate-50 text-slate-500 rounded-2xl p-6 border border-slate-100 text-center space-y-1.5 py-8">
                        <X className="w-8 h-8 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-xs text-slate-700">কোনো বাতিলকৃত ডিপোজিট নেই</h4>
                        <p className="text-[9px] text-slate-400">আপনার মাধ্যমে বাতিলকৃত নতুন ডিপোজিটগুলোর ইতিহাস এখানে দেখতে পাবেন।</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {cancelledDeposits.map((item) => (
                          <div 
                            key={item.id} 
                            className="bg-slate-50/80 rounded-2xl p-4 border border-slate-150 text-xs space-y-2.5 relative hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-bold text-slate-400">ID: {item.id}</span>
                              <span className="bg-rose-50 text-rose-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                বাতিলকৃত (CANCELLED)
                              </span>
                            </div>

                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[9px] text-slate-440 block font-semibold">গ্রাহক মোবাইল</span>
                                <span className="font-mono text-xs font-extrabold text-slate-800 tracking-wider">
                                  {item.customerPhone}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-440 block font-semibold">টাকার পরিমাণ</span>
                                <span className="font-mono font-black text-rose-700 block text-sm">
                                  ৳{item.amount}
                                </span>
                              </div>
                            </div>

                            <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 text-rose-800 space-y-1">
                              <span className="text-[9px] text-rose-500 font-extrabold block uppercase tracking-wider">বাতিলকরণের কারণ (Reason):</span>
                              <p className="font-semibold text-[11px] leading-relaxed">
                                {item.cancelReason || 'গ্রাহকের তথ্য সঠিক নয়'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-200/50 pt-2 font-mono">
                              <span>TxID: {item.customerTxnId}</span>
                              <span>{new Date(item.createdAt).toLocaleTimeString('bn-BD')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. CASH OUT FEATURES PANEL */}
            {activeFeature === 'cash_out' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">ক্যাশ-আউট (Withdrawal Center)</h3>
                    <span className="text-[10px] text-[#E2125B] block font-bold font-mono uppercase tracking-wider">Earn 3% Flat Commission</span>
                  </div>
                  <button 
                    onClick={() => setActiveFeature('none')}
                    className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Counts Status Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-sky-50 rounded-xl p-2 border border-sky-100 text-sky-800">
                    <span className="text-[9px] block text-slate-550">চলতি পেন্ডিং</span>
                    <span className="text-xs font-extrabold font-mono text-sky-900">{visiblePendingWithdrawals.length} টি</span>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-2 border border-rose-100 text-rose-800">
                    <span className="text-[9px] block text-slate-550">উইথড্র বাতিল</span>
                    <span className="text-xs font-extrabold font-mono text-rose-900">{cancelledWithdrawals.length} টি</span>
                  </div>
                  <div className="bg-[#E2125B]/5 rounded-xl p-2 border border-[#E2125B]/10 text-[#E2125B]">
                    <span className="text-[9px] block text-slate-550">মোট এপ্রুভড</span>
                    <span className="text-xs font-extrabold font-mono text-[#E2125B]">{approvedWithdrawals.length} টি</span>
                  </div>
                </div>

                {/* Options Selection Tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCashOutTab('requests')}
                    className={`flex-1 pb-2 text-xs font-extrabold text-center transition-all cursor-pointer ${
                      cashOutTab === 'requests' 
                        ? 'text-[#E2125B] border-b-2 border-[#E2125B]' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ১ঃ Withdrawal Request সমুহ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashOutTab('cancelled')}
                    className={`flex-1 pb-2 text-xs font-extrabold text-center transition-all cursor-pointer ${
                      cashOutTab === 'cancelled' 
                        ? 'text-[#E2125B] border-b-2 border-[#E2125B]' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ২ঃ Withdrawal বাতিল ({cancelledWithdrawals.length})
                  </button>
                </div>

                {/* Tab 1: Withdrawal Requests List */}
                {cashOutTab === 'requests' && (
                  <div className="space-y-3 pt-1">
                    {profile && profile.walletBalance === 0 ? (
                      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 space-y-2.5 text-xs">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-semibold">
                            আপনার এজেন্ট ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। দয়া করে ব্যালেন্স রিফিল করুন, তাহলেই নতুন কাস্টোমার উইথড্রয়াল অনুরোধগুলো আপনার ইনবক্স ও নোটিফিকেশনে একে একে আসতে শুরু করবে।
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveFeature('agent_cash')}
                          className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>ওয়ালেট ক্যাশ রিফিল করুন</span>
                        </button>
                      </div>
                    ) : visiblePendingWithdrawals.length === 0 ? (
                      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 text-indigo-900 text-center py-6 space-y-2">
                        <CheckCircle className="w-8 h-8 text-indigo-500 mx-auto" />
                        <h4 className="font-bold text-sm">কোনো Withdrawal অনুরোধ নেই</h4>
                        <p className="text-[10px] text-indigo-600 leading-relaxed px-2">
                          আপনার কারেন্ট ওয়ালেট ব্যালেন্স ৳{profile?.walletBalance}।
                        </p>
                        {totalSentSoFar < 15 ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/10 text-[#E2125B] text-[10px] font-black rounded-lg mt-1 border border-indigo-100/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E2125B] animate-ping shrink-0" />
                            পরবর্তী Withdrawal অনুরোধ {nextReqInSec} সেকেন্ডের মধ্যে পাঠানো হচ্ছে (আজ মোট {totalSentSoFar}/১৫ টি পাঠানো হয়েছে)
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg mt-1 border border-amber-200">
                            আজকের সর্বোচ্চ ১৫ টি উইথড্র রিকুয়েস্ট পাঠানো শেষ হয়েছে!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-emerald-50 rounded-xl px-3 py-1.5 border border-emerald-100 flex items-center justify-between gap-2 text-[10px] text-emerald-800 font-semibold mb-2">
                          <div className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-bounce" />
                            <span>সক্রিয় Withdrawal অনুরোধ (আজ মোট {totalSentSoFar}/১৫ টি রিলিজ করা হয়েছে)</span>
                          </div>
                          {totalSentSoFar < 15 && (
                            <span className="text-[9px] font-mono text-[#E2125B]">
                              নেক্সট রিকুয়েস্ট: {nextReqInSec}s
                            </span>
                          )}
                        </div>

                        {/* Rendering withdrawals one after another as prioritized queue */}
                        <div className="space-y-3.5">
                          {visiblePendingWithdrawals.map((item, index) => (
                            <div 
                              key={item.id} 
                              className={`rounded-2xl border p-4 space-y-3.5 transition-all duration-305 ${
                                index === 0 
                                  ? 'bg-gradient-to-br from-slate-50 to-white border-[#E2125B]/20 shadow-xs' 
                                  : 'bg-slate-50/60 border-slate-100 opacity-60 pointer-events-none scale-98'
                              }`}
                            >
                              {index === 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="bg-[#E2125B] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    সক্রিয় অনুরোধ (Active Request)
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 font-mono">
                                    ID: {item.id}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5 text-left">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">গ্রাহক মোবাইল নম্বর</label>
                                  <span className="font-mono text-sm font-extrabold text-slate-800 block select-all">
                                    {item.customerPhone}
                                  </span>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">টাকার পরিমাণ</label>
                                  <span className="text-base font-black text-[#E2125B] font-mono block">
                                    ৳{item.amount}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-100/70 p-3 rounded-xl flex items-center justify-between border border-slate-200/50 text-left">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">কাস্টোমার ট্রাঞ্জেকশন আইডি</span>
                                  <span className="font-mono text-xs font-black text-slate-700 block tracking-wider select-all">
                                    {item.customerTxnId}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="bg-rose-100 text-[#E2125B] text-[9px] font-bold px-2 py-0.5 rounded-xl">
                                    কমিশন: +৳{item.commissionEarned}
                                  </span>
                                </div>
                              </div>

                              {index === 0 ? (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setRejectingRequest(item)}
                                    className="w-full py-2.5 hover:bg-rose-105 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl transition-all border border-rose-200 cursor-pointer text-center"
                                  >
                                    বাতিল করুন
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApprovePreloaded(item)}
                                    className="w-full py-2.5 bg-[#E2125B] hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-200/50 cursor-pointer text-center"
                                  >
                                    এপ্রুভ করুন
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center py-1 text-[10px] text-slate-400 font-semibold">
                                  আগের অনুরোধটি সমাধান করুন...
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Cancelled Withdrawals List */}
                {cashOutTab === 'cancelled' && (
                  <div className="space-y-3 pt-1">
                    {cancelledWithdrawals.length === 0 ? (
                      <div className="bg-slate-50 text-slate-500 rounded-2xl p-6 border border-slate-100 text-center space-y-1.5 py-8">
                        <X className="w-8 h-8 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-xs text-slate-700">কোনো বাতিলকৃত Withdrawal নেই</h4>
                        <p className="text-[9px] text-slate-400">আপনার মাধ্যমে বাতিলকৃত নতুন উইথড্রয়ালগুলোর ইতিহাস এখানে দেখতে পাবেন।</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {cancelledWithdrawals.map((item) => (
                          <div 
                            key={item.id} 
                            className="bg-slate-50/80 rounded-2xl p-4 border border-slate-150 text-xs space-y-2.5 relative hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-bold text-slate-400">ID: {item.id}</span>
                              <span className="bg-rose-50 text-rose-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                বাতিলকৃত (CANCELLED)
                              </span>
                            </div>

                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[9px] text-slate-440 block font-semibold">গ্রাহক মোবাইল</span>
                                <span className="font-mono text-xs font-extrabold text-slate-800 tracking-wider">
                                  {item.customerPhone}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-440 block font-semibold">টাকার পরিমাণ</span>
                                <span className="font-mono font-black text-rose-700 block text-sm">
                                  ৳{item.amount}
                                </span>
                              </div>
                            </div>

                            <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 text-rose-800 space-y-1">
                              <span className="text-[9px] text-rose-500 font-extrabold block uppercase tracking-wider">বাতিলকরণের কারণ (Reason):</span>
                              <p className="font-semibold text-[11px] leading-relaxed">
                                {item.cancelReason || 'গ্রাহকের তথ্য সঠিক নয়'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-200/50 pt-2 font-mono">
                              <span>TxID: {item.customerTxnId}</span>
                              <span>{new Date(item.createdAt).toLocaleTimeString('bn-BD')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. MOBILE RECHARGE SCREEN VIEW */}
            {activeFeature === 'recharge' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="text-sm font-bold text-slate-800">মোবাইল লাইভ রিচার্জ (Mobile Recharge)</h3>
                  <button onClick={() => setActiveFeature('none')} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleMobileRechargeSubmit} className="space-y-4">
                  {/* Operator selector */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1.5">সিম অপারেটর পছন্দ করুন (Operator)</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['Grameenphone', 'Robi', 'Airtel', 'Teletalk', 'Banglalink'].map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setRechargeOperator(op)}
                          className={`py-2 px-1 rounded-xl text-[9px] font-bold border transition-colors select-none text-center ${
                            rechargeOperator === op 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {op === 'Grameenphone' ? 'GP' : op === 'Robi' ? 'Robi' : op === 'Airtel' ? 'Airtel' : op === 'Teletalk' ? 'Teletalk' : 'BL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">সিম মোবাইল নম্বর (Mobile Number)</label>
                    <input 
                      type="tel" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      required
                      className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">রিচার্জ পরিমাণ (৳)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="রিচার্জ টাকার পরিমাণ"
                      required
                      className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" 
                    />
                    <div className="flex gap-2 mt-2">
                      {[19, 49, 99, 149].map(preset => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setAmount(String(preset))}
                          className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold"
                        >
                          ৳{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-all shadow-md mt-2 cursor-pointer"
                  >
                    মোবাইল রিচার্জ নিশ্চিত করুন
                  </button>
                </form>
              </div>
            )}

            {/* 4. BILL PAYMENT SCREEN VIEW */}
            {activeFeature === 'bill_pay' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="text-sm font-bold text-slate-800">অনলাইন বিল পেমেন্ট (Utility Bill Pay)</h3>
                  <button onClick={() => setActiveFeature('none')} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleBillPaymentSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">বিলার ক্যাটাগরি পছন্দ করুন (Biller Category)</label>
                    <select
                      value={billerName}
                      onChange={(e) => setBillerName(e.target.value)}
                      className="w-full text-slate-800 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    >
                      <option value="DESCO Electricity">DESCO Electricity (বিদ্যুৎ)</option>
                      <option value="Link3 Internet">Link3 Internet Service (ইন্টারনেট)</option>
                      <option value="Dhaka WASA Water">Dhaka WASA (পানি)</option>
                      <option value="Carnival Broadband">Carnival Local WiFi (ইন্টারনেট)</option>
                      <option value="Titas Gas Line">Titas Gas Connection (গ্যাস)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">গ্রাহক মিটার নম্বার / কনজিউমার আইডি</label>
                    <input 
                      type="text" 
                      value={billMeterNo}
                      onChange={(e) => setBillMeterNo(e.target.value)}
                      placeholder="উদাঃ ৯৮২৪৫৭০১২"
                      required
                      className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">বিলের পরিমাণ (৳)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="টাকার পরিমাণ দিন"
                      required
                      className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#E2125B] hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-all shadow-md mt-2 cursor-pointer"
                  >
                    অনলাইন বিল পেমেন্ট করুন
                  </button>
                </form>
              </div>
            )}

            {/* 5. AGENT CASH REFILL (FUND REQUESTS) COLLECTION */}
            {activeFeature === 'agent_cash' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">ওয়ালেট ব্যালেন্স রিফিল (Refill Agent Account)</h3>
                    <span className="text-[10px] text-slate-400 block">কমপক্ষে ১০$ (১২০০ টাকা) রিফিল আবেদন করুন</span>
                  </div>
                  <button onClick={() => setActiveFeature('none')} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2 text-xs">
                  <p className="font-bold text-slate-700">টাকা পাঠানোর এডমিন বিবরণ :</p>
                  <p className="text-slate-600">নিচে প্রদানকৃত বিকাশ বা নগদ নম্বরে <strong>Sent Money</strong> করুন এবং ট্রানজেকশন আইডি কপি করে নিন:</p>
                  <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px] font-mono font-bold">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-indigo-700">
                      <span className="text-[9px] block text-slate-400 font-sans font-medium">বিকাশ Personal :</span>
                      01799244455
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-rose-700">
                      <span className="text-[9px] block text-slate-400 font-sans font-medium">নগদ Personal :</span>
                      01912444550
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAgentCashRequestSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 block mb-1 uppercase tracking-wider">১. পেমেন্ট গেটওয়ে নির্বাচন করুন</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAgentCashMethod('bKash')}
                        className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          agentCashMethod === 'bKash' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        bKash (বিকাশ)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgentCashMethod('Nagad')}
                        className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          agentCashMethod === 'Nagad' ? 'bg-orange-50 border-orange-600 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Nagad (নগদ)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 block mb-1 uppercase tracking-wider">২. মোবাইল নম্বর (যে নম্বর থেকে টাকা পাঠিয়েছেন)</label>
                    <input 
                      type="tel" 
                      value={agentCashSenderPhone}
                      onChange={(e) => setAgentCashSenderPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      required
                      maxLength={11}
                      className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 block mb-1 uppercase tracking-wider">৩. টাকার পরিমাণ (কমপক্ষে ১২০০ টাকা)</label>
                    <input 
                      type="number" 
                      value={agentCashAmount}
                      onChange={(e) => setAgentCashAmount(e.target.value)}
                      placeholder="টাকার পরিমাণ (যেমন ১২০০ BDT)"
                      required
                      className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                    />
                    {agentCashAmount && Number(agentCashAmount) >= 1200 && (
                      <span className="text-[10px] text-emerald-600 font-extrabold block mt-1">
                        সমপরিমাণ ডলার হিসাব: ${(Number(agentCashAmount) / 120).toFixed(2)} USD (রেট: ১$ = ১২০ টাকা)
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 block mb-1 uppercase tracking-wider">৪. সঠিক ট্রানজেকশন আইডি (TxnID)</label>
                    <input 
                      type="text" 
                      value={agentCashTxnId}
                      onChange={(e) => setAgentCashTxnId(e.target.value)}
                      placeholder="যেমন 9K54DFST7R"
                      required
                      className="w-full text-slate-800 text-xs py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-mono focus:ring-1 focus:ring-rose-500" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 block mb-1 uppercase tracking-wider">৫. লেনদেন স্ক্রিনশট সংযুক্ত করুন (bKash/Nagad Screenshot)</label>
                    
                    {/* Visual File Upload Dropzone */}
                    <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setScreenshotFileName(file.name);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setScreenshotFileBase64(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="screenshot-uploader"
                      />
                      
                      {!screenshotFileBase64 ? (
                        <div className="text-center space-y-1.5 pointer-events-none">
                          <div className="mx-auto w-8 h-8 rounded-full bg-[#E2125B]/5 flex items-center justify-center text-[#E2125B]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 block">গ্যালারি থেকে স্ক্রিনশট নির্বাচন বা ড্র্যাগ করুন</span>
                          <span className="text-[9px] text-slate-400 block font-medium">সমর্থিত ফরম্যাট: PNG, JPG, JPEG</span>
                        </div>
                      ) : (
                        <div className="w-full relative z-10 flex items-center gap-3">
                          <img 
                            src={screenshotFileBase64} 
                            alt="Screenshot Preview" 
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-700 block truncate">{screenshotFileName || 'uploaded_image.png'}</span>
                            <span className="text-[8px] text-emerald-600 font-extrabold block uppercase tracking-wide">✓ রেডি (Ready to upload)</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setScreenshotFileBase64('');
                              setScreenshotFileName('');
                            }}
                            className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Simulated Receipt button for easy testing */}
                    {!screenshotFileBase64 && (
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotFileName('simulated_receipt_success.png');
                          setScreenshotFileBase64('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=50&w=300&auto=format&fit=crop');
                          triggerMessage('টেস্টিং ডেমো স্ক্রিনশট সংযুক্ত করা হয়েছে!', 'info');
                        }}
                        className="mt-1.5 text-[10px] text-indigo-700 hover:underline font-bold flex items-center gap-1 cursor-pointer bg-slate-50 border border-slate-150 rounded-lg py-1 px-2 w-max"
                      >
                        <span>🪄 ডেমো রিফিল স্ক্রিনশট সিমুলেট করুন (Quick Test)</span>
                      </button>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#E2125B] hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer text-center"
                  >
                    ওয়ালেট রিফিল আবেদন পাঠান (৳{agentCashAmount || '0'} BDT)
                  </button>
                </form>

                {/* Refills histories */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">আপনার গত আবেদনসমূহ</span>
                    <span className="text-[9px] text-[#E2125B] font-bold">৩০ সেকেন্ডেই রিফিল রিচার্জ অটো এপ্রুভ হয়</span>
                  </div>
                  
                  {cashRequests.filter(r => r.agentId === currentUser.uid).length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-2">কোনো রিফিল আবেদন নেই।</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {cashRequests.filter(r => r.agentId === currentUser.uid).map((req) => {
                        const createdTime = new Date(req.createdAt).getTime();
                        const secondsElapsed = Math.floor((tickTime - createdTime) / 1000);
                        const delayLimit = req.autoApproveDelay || 45;
                        const remaining = delayLimit - secondsElapsed;

                        return (
                          <div key={req.id} className="p-3 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-150/70 text-xs text-left space-y-2 transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-extrabold text-slate-800 text-sm">৳{req.amountBdt} ({req.paymentMethod})</p>
                                <span className="text-[9px] text-slate-400 font-mono block">TxID: {req.transactionId}</span>
                              </div>
                              
                              <div className="text-right">
                                {req.status === 'pending' ? (
                                  remaining > 0 ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                      {remaining}s পর অটো-এপ্রুভড হবে
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-spin shrink-0 border-t-transparent border border-indigo-100" />
                                      প্রসেসিং হচ্ছে...
                                    </span>
                                  )
                                ) : (
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {req.status === 'approved' ? '✓ এপ্রুভড' : '✕ বাতিল'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Additional displayable info: Sender Mobile & Screenshot thumbnail link */}
                            <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 pt-2 gap-2">
                              <span>যে নাম্বার থেকে পাঠিয়েছেন: <strong className="font-mono">{req.senderPhone || 'N/A'}</strong></span>
                              {req.screenshotUrl && (
                                <a 
                                  href={req.screenshotUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[10px] font-extrabold text-indigo-600 hover:underline flex items-center gap-1 shrink-0"
                                >
                                  📸 রিসিট দেখুন
                                </a>
                              )}
                            </div>

                            {/* Simulated timer bar */}
                            {req.status === 'pending' && remaining > 0 && (
                              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-amber-500 h-full transition-all duration-1000" 
                                  style={{ width: `${Math.min(100, (secondsElapsed / delayLimit) * 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 6. AGENT WITHDRAW VIEW (COMMISSION UTILITY PAYOUT) */}
            {activeFeature === 'agent_withdraw' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">কমিশন ও ওয়ালেট ব্যালেন্স উত্তোলন</h3>
                    <span className="text-[10px] text-slate-400 block pb-1">আপনার প্রয়োজনীয় ব্যালেন্স সোর্স সিলেক্ট করুন</span>
                  </div>
                  <button onClick={() => setActiveFeature('none')} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAgentWithdrawRequestSubmit} className="space-y-4">
                  {/* TWO UTILITY SOURCES REQUIRED BY USER */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">উত্তোলনের ব্যালেন্স সোর্স (Withdrawal Source)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawSource('commission')}
                        className={`py-2.5 px-3 rounded-xl text-[11px] font-black border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          withdrawSource === 'commission' ? 'bg-[#E2125B]/5 border-[#E2125B] text-[#E2125B] ring-2 ring-[#E2125B]/10' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>কমিশন ব্যালেন্স</span>
                        <span className="text-[10px] font-bold mt-0.5">৳{profile?.commissionBalance}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawSource('wallet')}
                        className={`py-2.5 px-3 rounded-xl text-[11px] font-black border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          withdrawSource === 'wallet' ? 'bg-[#E2125B]/5 border-[#E2125B] text-[#E2125B] ring-2 ring-[#E2125B]/10' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>মূল ওয়ালেট ব্যালেন্স</span>
                        <span className="text-[10px] font-bold mt-0.5">৳{profile?.walletBalance}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">পেমেন্ট মেথড (Payment Method)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawMethod('bKash')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          withdrawMethod === 'bKash' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        bKash (বিকাশ)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawMethod('Nagad')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          withdrawMethod === 'Nagad' ? 'bg-orange-50 border-orange-600 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        Nagad (নগদ)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">আপনার বিকাশ/নগদ নম্বর</label>
                    <input 
                      type="tel" 
                      value={withdrawNumber}
                      onChange={(e) => setWithdrawNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      required
                      className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">উত্তোলন টাকার পরিমাণ (৳)</label>
                    <input 
                      type="number" 
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="৳ টাকার পরিমাণ"
                      required
                      className="w-full text-slate-800 text-sm py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#E2125B] hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {withdrawSource === 'commission' ? 'কমিশন পেআউট সাবমিট করুন' : 'মুল ওয়ালেট পেআউট সাবমিট করুন'}
                  </button>
                </form>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">উত্তোলন হিস্টোরি</span>
                  {withdrawRequests.filter(w => w.agentId === currentUser.uid).length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-2">কোনো উত্তোলনের ইতিহাস নেই।</p>
                  ) : (
                    <div className="space-y-1.5 max-h-45 overflow-y-auto no-scrollbar">
                      {withdrawRequests.filter(w => w.agentId === currentUser.uid).map((req) => (
                        <div key={req.id} className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-800">৳{req.amountBdt} ({req.paymentMethod})</p>
                              <span className="text-[8px] px-1 bg-slate-200 text-slate-700 font-bold rounded">
                                {req.withdrawSource === 'wallet' ? 'মূল ওয়ালেট' : 'কমিশন'}
                              </span>
                            </div>
                            <span className="text-[9px] block text-slate-400 font-mono">নম্বর: {req.paymentNumber}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'approved' ? 'সম্পন্ন' : req.status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 7. HELP DESK FULL EXPANSION VIEW */}
            {activeFeature === 'help_desk' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">হেল্প ডেস্ক এবং ব্যবহার নির্দেশনাবলী</h3>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">E-Wallet Agent Help Support</span>
                  </div>
                  <button onClick={() => setActiveFeature('none')} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200">
                    <X className="w-4 h-4 animate-spin" />
                  </button>
                </div>
                <HelpDesk />
              </div>
            )}

            {/* 8. SUPER ADMIN DASHBOARD PANEL (FOR bdwalletagent@gmail.com) */}
            {activeFeature === 'admin_dashboard' && profile?.role === 'admin' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-lg text-left flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span>সুপার এডমিন কন্ট্রোল প্যানেল</span>
                    </h3>
                    <span className="text-[10px] text-rose-500 font-bold block uppercase tracking-wide">Registered Admin Privileges</span>
                  </div>
                  <button onClick={() => setActiveFeature('none')} className="p-1 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* CORE AGENTS LIST AND BALANCES */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">সকল নিবন্ধিত এজেন্ট ইউজারস ({adminAgents.length})</h4>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
                    {adminAgents.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-2">কোনো এজেন্ট রেজিস্টার্ড নেই।</p>
                    ) : (
                      adminAgents.map(ag => (
                        <div key={ag.uid} className="p-2.5 bg-slate-50 rounded-xl leading-normal text-xs border border-slate-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-800">{ag.name}</p>
                              <span className="text-[9px] text-slate-400 block font-mono">{ag.email} | {ag.phone}</span>
                            </div>
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                              {ag.role}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/50 text-[10px] text-slate-500">
                            <div>Wallet Bal: <strong className="text-slate-800 font-mono text-xs">৳{ag.walletBalance}</strong></div>
                            <div>Comm Bal: <strong className="text-rose-600 font-mono text-xs">৳{ag.commissionBalance}</strong></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ADMINISTRATIVE REFUNDS / REFILL APPROVALS */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">এজেন্ট ডিপোজিট আবেদন (Refill Requests)</h4>
                  <div className="space-y-3.5 max-h-64 overflow-y-auto no-scrollbar">
                    {cashRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="text-center py-6 text-slate-400 border border-dashed border-slate-150 rounded-2xl bg-slate-50">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1 animate-bounce" />
                        <p className="text-[10px] font-bold">কোনো পেন্ডিং রিফিল রিকোয়েস্ট নেই</p>
                      </div>
                    ) : (
                      cashRequests.filter(r => r.status === 'pending').map(req => (
                        <div key={req.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5">
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <h5 className="font-bold text-slate-800">{req.agentName}</h5>
                              <span className="text-[9px] text-slate-400 block font-mono">{req.paymentMethod} • TxnID: {req.transactionId}</span>
                            </div>
                            <span className="text-sm font-extrabold text-indigo-600 font-mono">৳{req.amountBdt}</span>
                          </div>

                          {req.screenshotUrl && (
                            <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-100 rounded-lg text-[10px] text-slate-500 font-sans">
                              <Image className="w-3.5 h-3.5 text-indigo-500" />
                              <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="underline font-semibold text-slate-700 truncate">
                                পেমেন্ট রশিদ স্ক্রিনশট দেখুন
                              </a>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 text-[10px]">
                            <button 
                              onClick={() => handleAdminRejectCashRefill(req)}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold border border-rose-100 cursor-pointer"
                            >
                              রিজেক্ট (Reject)
                            </button>
                            <button 
                              onClick={() => handleAdminApproveCashRefill(req)}
                              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                            >
                              এপ্রুভ করুন (Give Wallet)
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* PORTAL WTHDRAWAL PAYOUT APPROVALS */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
                  <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3">এজেন্ট কমিশন উত্তোলন আবেদন (Payouts)</h4>
                  <div className="space-y-3.5 max-h-64 overflow-y-auto no-scrollbar">
                    {withdrawRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="text-center py-6 text-slate-400 border border-dashed border-slate-150 rounded-2xl bg-slate-50">
                        <CheckCircle className="w-8 h-8 text-rose-300 mx-auto mb-1" />
                        <p className="text-[10px] font-bold">কোনো পেন্ডিং কমিশন উত্তোলন রিকোয়েস্ট নেই</p>
                      </div>
                    ) : (
                      withdrawRequests.filter(r => r.status === 'pending').map(req => (
                        <div key={req.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5">
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="font-bold text-slate-800">{req.agentName}</h5>
                                <span className="text-[8px] font-extrabold bg-[#E2125B]/10 text-[#E2125B] px-1.5 py-0.2 rounded-full">
                                  {req.withdrawSource === 'wallet' ? 'মূল ওয়ালেট' : 'কমিশন ব্যালেন্স'}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{req.paymentMethod} পেমেন্ট নম্বর: {req.paymentNumber}</p>
                            </div>
                            <span className="text-sm font-extrabold text-rose-600 font-mono">৳{req.amountBdt}</span>
                          </div>

                          <div className="flex justify-end gap-2 text-[10px]">
                            <button 
                              onClick={() => handleAdminRejectPayout(req)}
                              className="px-3 py-1 bg-slate-250 text-slate-700 rounded-lg font-bold cursor-pointer"
                            >
                              রিজেক্ট করা হোক
                            </button>
                            <button 
                              onClick={() => handleAdminApprovePayout(req)}
                              className="px-3.5 py-1 bg-[#E2125B] hover:bg-rose-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                            >
                              পেমেন্ট সম্পন্ন (Paid)
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB-2: ALL ARCHIVE TRANSACTION HISTORY VIEWER */}
            {currentTab === 'transactions_list' && activeFeature === 'none' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">লেনদেন ইতিহাস (Archived Transactions Log)</h3>
                    <span className="text-[9px] text-slate-400 block mt-0.5">সবগুলো অনুমোদিত বা বাতিলকৃত হিসেব</span>
                  </div>
                  <button onClick={() => setCurrentTab('dashboard')} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {dbTransactions.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-8">কোনো লেনদেন রেকর্ড পাওয়া যায়নি।</p>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto no-scrollbar">
                    {dbTransactions.map((log) => (
                      <div 
                        key={log.id}
                        onClick={() => setShowReceipt(log)}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-2.5 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex gap-2.5 items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                            {log.type === 'deposit' ? '📥' : log.type === 'withdraw' ? '📤' : log.type === 'recharge' ? '📱' : '🧾'}
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-800 block">{log.customerPhone}</span>
                            <span className="text-[9px] font-bold text-slate-400 block mt-0.5 capitalize">{log.details || log.type}</span>
                            <span className="text-[8px] text-slate-350">{new Date(log.createdAt).toLocaleString('bn-BD')}</span>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <div>
                            <strong className="text-xs font-mono font-bold block text-slate-800">৳{log.amount}</strong>
                            {log.commissionEarned > 0 && (
                              <span className="text-[8px] text-emerald-600 block leading-none font-bold mt-0.5">আয় +৳{log.commissionEarned}</span>
                            )}
                            <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded mt-1 uppercase ${
                              log.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {log.status === 'approved' ? 'সফল হয়েছে' : 'বাতিল'}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteDatabaseTransaction(e, log.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন (ডিলিট)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB-3: PROFILE SECTION */}
            {currentTab === 'profile' && activeFeature === 'none' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-5">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="text-sm font-bold text-slate-800">এজেন্ট একাউন্ট প্রোফাইল</h3>
                  <button onClick={() => setCurrentTab('dashboard')} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile Widget Card with Photo Upload and Preview support */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center space-y-2">
                  <div className="relative group inline-block mx-auto">
                    <input 
                      type="file" 
                      id="tab-profile-avatar-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProfileAvatarChange(file);
                      }}
                    />
                    <button 
                      onClick={() => document.getElementById('tab-profile-avatar-upload')?.click()}
                      className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-[#E2125B] hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer relative flex items-center justify-center mx-auto"
                      title="প্রোফাইল ছবি পরিবর্তন করতে ক্লিক করুন"
                    >
                      {profile?.avatarUrl ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt={profile?.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#E2125B] text-white flex items-center justify-center font-extrabold text-lg uppercase">
                          {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'A'}
                        </div>
                      )}
                      {/* Hover camera overlay */}
                      <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </button>
                    {/* Small button helper link */}
                    <button 
                      onClick={() => document.getElementById('tab-profile-avatar-upload')?.click()}
                      className="text-[9px] text-[#E2125B] font-extrabold hover:underline block mt-1 mx-auto cursor-pointer"
                    >
                      ছবি পরিবর্তন করুন
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{profile?.name}</h4>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold py-0.5 px-2 rounded-full uppercase">
                    ID: #{profile?.uid.slice(0, 6).toUpperCase()}
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs text-left pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-sans">ইমেইল ঠিকানা</span>
                      <strong className="text-slate-700 truncate block">{profile?.email}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-sans">মোবাইল নম্বর</span>
                      <strong className="text-slate-700 block">{profile?.phone}</strong>
                    </div>
                  </div>
                </div>

                {/* Core Earnings Log Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">মোট আয় বিবরণী (Earnings Summary)</h4>
                  
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-bold">আজকের কমিশন আয়:</span>
                    <strong className="text-indigo-800 font-mono">৳{profile?.todayEarnings}</strong>
                  </div>

                  <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-bold">চলতি মাসের কমিশন আয়:</span>
                    <strong className="text-violet-800 font-mono">৳{profile?.monthlyEarnings}</strong>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-bold">সর্বমোট সর্বকালীন কমিশন আয়:</span>
                    <strong className="text-emerald-800 font-mono">৳{profile?.totalEarnings}</strong>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>লগআউট করুন (Log Out)</span>
                </button>
              </div>
            )}

          </div>

          {/* Bottom App Navigation Bar (Simulates clean persistent material mobile nav) */}
          <div className="bg-white text-slate-400 py-2 h-14 border-t border-slate-100 flex justify-around items-center shrink-0 z-30 select-none">
            
            <button 
              onClick={() => { setActiveFeature('none'); setCurrentTab('dashboard'); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 max-w-[80px] focus:outline-none cursor-pointer ${
                activeFeature === 'none' && currentTab === 'dashboard' ? 'text-[#E2125B]' : 'text-slate-405'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[10px] font-bold">মূলপাতা</span>
            </button>

            <button 
              onClick={() => { setActiveFeature('none'); setCurrentTab('transactions_list'); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 max-w-[80px] focus:outline-none cursor-pointer ${
                currentTab === 'transactions_list' && activeFeature === 'none' ? 'text-[#E2125B]' : 'text-slate-405'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-[10px] font-bold">হিস্টোরি</span>
            </button>

            <button 
              onClick={() => { setActiveFeature('agent_cash'); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 max-w-[80px] focus:outline-none cursor-pointer ${
                activeFeature === 'agent_cash' ? 'text-[#E11] text-indigo-600' : 'text-slate-405'
              }`}
            >
              <Coins className="w-5 h-5" />
              <span className="text-[10px] font-bold">রিফিল</span>
            </button>

            <button 
              onClick={() => { setActiveFeature('none'); setCurrentTab('profile'); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 max-w-[80px] focus:outline-none cursor-pointer ${
                currentTab === 'profile' && activeFeature === 'none' ? 'text-[#E2125B]' : 'text-slate-405'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold">প্রোফাইল</span>
            </button>

          </div>

          {/* Render digital receipt modal for successful cash activities */}
          {showReceipt && (
            <ReceiptModal 
              transaction={showReceipt} 
              onClose={() => setShowReceipt(null)} 
            />
          )}

          {/* Rejection Reason Modal */}
          {rejectingRequest && (
            <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50">
              <div className="bg-white w-full rounded-t-[32px] p-6 shadow-2xl space-y-4 max-h-[85%] overflow-y-auto animate-in slide-in-from-bottom duration-250">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-slate-800">ডিপোজিট বাতিল করার কারণ</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {rejectingRequest.id} | Amount: ৳{rejectingRequest.amount}</p>
                  </div>
                  <button 
                    onClick={() => { setRejectingRequest(null); setCustomRejectReason(''); }}
                    className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Predefined Reasons */}
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">যেকোনো একটি কারণ বেছে নিন:</span>
                  {[
                    'ভুল ট্রানজেকশন আইডি (Invalid TxnID)',
                    'সতি্যকার পেমেন্ট এজেন্ট একাউন্টে জমা হয়নি (Amount not received)',
                    'গ্রাহকের মোবাইল নম্বরটি ভুল (Wrong customer number)',
                    'ডিপোজিটের পরিমাণ সঠিক নয় (Incorrect deposit amount)',
                    'অন্যান্য কারণ (Other reason)'
                  ].map((reasonOption) => (
                    <button
                      key={reasonOption}
                      type="button"
                      onClick={() => {
                        setSelectedRejectReason(reasonOption);
                        if (reasonOption !== 'অন্যান্য কারণ (Other reason)') {
                          setCustomRejectReason('');
                        }
                      }}
                      className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                        selectedRejectReason === reasonOption
                          ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{reasonOption}</span>
                      {selectedRejectReason === reasonOption && (
                        <CheckCircle2 className="w-4 h-4 text-[#E2125B]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom input field if "Other" is picked */}
                {selectedRejectReason === 'অন্যান্য কারণ (Other reason)' && (
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-slate-600 block">অন্যান্য কারণটি বিস্তারিত এখানে লিখুন:</label>
                    <textarea
                      rows={2}
                      value={customRejectReason}
                      onChange={(e) => setCustomRejectReason(e.target.value)}
                      placeholder="বাতিল করার নির্দিষ্ট কারণ লিখুন..."
                      className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setRejectingRequest(null); setCustomRejectReason(''); }}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    ফিরে যান (Close)
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const finalReason = selectedRejectReason === 'অন্যান্য কারণ (Other reason)'
                        ? customRejectReason.trim() || 'অন্যান্য কারণ'
                        : selectedRejectReason;
                      await handleCancelPreloaded(rejectingRequest, finalReason);
                      setRejectingRequest(null);
                      setCustomRejectReason('');
                    }}
                    className="w-full py-3 bg-[#E2125B] hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-100 cursor-pointer"
                  >
                    বাতিল নিশ্চিত করুন
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </PhoneFrame>
  );
}

import { TransactionRecord } from '../types';

// Generate 150 deposit requests programmatically with authentic Bangladeshi phone numbers and customer txn IDs
export function generatePreloadedRequests(agentId: string): TransactionRecord[] {
  const list: TransactionRecord[] = [];
  
  // Array of realistic Bangladeshi phone operator prefixes
  const prefixes = ['017', '019', '015', '016', '018', '013', '014'];
  
  // Helper to generate a random phone number
  const genPhone = (index: number, isIncorrectFlag: boolean = false) => {
    const pref = prefixes[index % prefixes.length];
    if (isIncorrectFlag) {
      // 10 digits: prefix (3) + '5' (1) + rest of length 6 (6) = 10 digits
      const rest = String(index).padStart(6, '0');
      return `${pref}5${rest}`;
    } else {
      // 11 digits: prefix (3) + '5' (1) + rest of length 7 (7) = 11 digits
      const rest = String(index).padStart(7, '0');
      return `${pref}5${rest}`;
    }
  };

  // Helper to generate realistic customer transaction IDs (BKash, Nagad style)
  const genTxnId = (index: number) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let txn = '8';
    for (let i = 0; i < 7; i++) {
      txn += chars.charAt((index * (i + 1) + 13) % chars.length);
    }
    return txn;
  };

  // Generate 150 Deposits (Alternating 500 BDT, 1000 BDT, 1500 BDT, earning 5% commission)
  for (let i = 1; i <= 150; i++) {
    let amount = 500;
    if (i % 3 === 2) {
      amount = 1000;
    } else if (i % 3 === 0) {
      amount = 1500;
    }
    
    const commission = Math.round(amount * 0.05 * 100) / 100; // 5% flat commission

    // Every 5th deposit request is intentionally incorrect (10 digits) so agents can identify & cancel
    const isIncorrect = (i % 5 === 0);

    list.push({
      id: `DEP-${String(i).padStart(3, '0')}`,
      agentId,
      type: 'deposit',
      customerPhone: genPhone(i + 1200, isIncorrect),
      amount,
      commissionEarned: commission,
      status: 'pending',
      details: isIncorrect 
        ? 'Automatic User Cash In Request (⚠️ ভুল ১০-ডিজিট নম্বর)' 
        : 'Automatic User Cash In Request (Automatic)',
      createdAt: new Date(Date.now() - (151 - i) * 15 * 60 * 1000).toISOString(), // slightly staggered past times
      isAutomatic: true,
      customerTxnId: genTxnId(i + 4000)
    });
  }

  // Generate 150 Withdrawals (Alternating 500 BDT, 1000 BDT, 1500 BDT, earning 3% commission)
  for (let i = 1; i <= 150; i++) {
    let amount = 500;
    if (i % 3 === 2) {
      amount = 1000;
    } else if (i % 3 === 0) {
      amount = 1500;
    }
    
    const commission = Math.round(amount * 0.03 * 100) / 100; // 3% flat commission for Cash Out

    list.push({
      id: `WTH-${String(i).padStart(3, '0')}`,
      agentId,
      type: 'withdraw',
      customerPhone: genPhone(i + 2200),
      amount,
      commissionEarned: commission,
      status: 'pending',
      details: 'Automatic User Cash Out Request (Automatic)',
      createdAt: new Date(Date.now() - (151 - i) * 15 * 60 * 1000 + 5000).toISOString(), // slightly staggered past times
      isAutomatic: true,
      customerTxnId: genTxnId(i + 6000)
    });
  }

  return list;
}

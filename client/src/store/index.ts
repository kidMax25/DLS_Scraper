import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { Match, MatchType, Transaction } from '@/types';

type UserState = {
  user: User | null;
  dlsId: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  firstName: string;
  teamName: string;
  moneyAccountConnected: boolean;
  hasDlsId: boolean;
}

type MatchState = {
  matches: Match[];
  currentMatch: Match | null;
  matchHistory: Match[];
}

type UIState = {
  theme: 'dark' | 'light' | 'system';
  showConsentModal: boolean;
  notifications: boolean;
}

type TransactionState = {
  transactions: Transaction[];
}

interface AppState extends 
  UserState, 
  MatchState, 
  UIState, 
  TransactionState {
  // User actions
  setUser: (user: User | null) => void;
  setDlsId: (dlsId: string) => void;
  setBalance: (balance: number) => void;
  updateBalanceBy: (amount: number) => void;
  setFirstName: (firstName: string) => void;
  setTeamName: (teamName: string) => void;
  toggleMoneyAccountConnection: () => void;
  
  // Match actions
  setCurrentMatch: (match: Match | null) => void;
  addMatch: (match: Match) => void;
  updateMatchHistory: (matches: Match[]) => void;
  
  // UI actions
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setShowConsentModal: (show: boolean) => void;
  setNotifications: (enabled: boolean) => void;
  
  // Transaction actions
  addTransaction: (transaction: Transaction) => void;
  updateTransactions: (transactions: Transaction[]) => void;
}

const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // User state
        user: null,
        dlsId: '',
        balance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        firstName: '',
        teamName: '',
        moneyAccountConnected: false,
        hasDlsId: false,
        
        // Match state
        matches: [],
        currentMatch: null,
        matchHistory: [],
        
        // UI state
        theme: 'system',
        showConsentModal: true,
        notifications: true,
        
        // Transaction state
        transactions: [],
        
        // User actions
        setUser: (user) => set({ user }),
        setDlsId: (dlsId) => set({ dlsId, hasDlsId: dlsId !== '' }),
        setBalance: (balance) => set({ balance }),
        updateBalanceBy: (amount) => set((state) => ({ balance: state.balance + amount })),
        setFirstName: (firstName) => set({ firstName }),
        setTeamName: (teamName) => set({ teamName }),
        toggleMoneyAccountConnection: () => set((state) => ({ moneyAccountConnected: !state.moneyAccountConnected })),
        
        // Match actions
        setCurrentMatch: (match) => set({ currentMatch: match }),
        addMatch: (match) => set((state) => ({ 
          matches: [...state.matches, match],
          matchHistory: [match, ...state.matchHistory].slice(0, 20) // Keep last 20 matches
        })),
        updateMatchHistory: (matches) => set({ matchHistory: matches }),
        
        // UI actions
        setTheme: (theme) => set({ theme }),
        setShowConsentModal: (show) => set({ showConsentModal: show }),
        setNotifications: (enabled) => set({ notifications: enabled }),
        
        // Transaction actions
        addTransaction: (transaction) => set((state) => ({ 
          transactions: [transaction, ...state.transactions] 
        })),
        updateTransactions: (transactions) => set({ transactions }),
      }),
      {
        name: 'legends-arena-storage',
        partialize: (state) => ({
          user: state.user,
          dlsId: state.dlsId,
          balance: state.balance,
          totalDeposited: state.totalDeposited,
          totalWithdrawn: state.totalWithdrawn,
          firstName: state.firstName,
          teamName: state.teamName,
          moneyAccountConnected: state.moneyAccountConnected,
          hasDlsId: state.hasDlsId,
          theme: state.theme,
          matchHistory: state.matchHistory,
          transactions: state.transactions,
        }),
      }
    )
  )
);

export default useStore;
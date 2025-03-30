'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUp, ArrowDown, Plus } from 'lucide-react';
import useStore from '@/store';
import { TransactionType, Transaction } from '@/types';
import { formatCurrency, calculatePercentChange, formatDate, apiCall } from '@/lib/utils';

type FilterType = 'all' | 'deposits' | 'withdrawals';

export default function FundsPage() {
  const { toast } = useToast();
  const [isUSDT, setIsUSDT] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const balance = useStore((state) => state.balance);
  const totalDeposited = useStore((state) => state.totalDeposited);
  const totalWithdrawn = useStore((state) => state.totalWithdrawn);
  const transactions = useStore((state) => state.transactions);
  const updateTransactions = useStore((state) => state.updateTransactions);
  
  // Fetch transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // In a real app, fetch from API
        // const data = await apiCall('/api/transactions');
        // updateTransactions(data);
        
        // For demo, use mock data if none exists
        if (transactions.length === 0) {
          const mockTransactions: Transaction[] = [
            {
              id: '1',
              type: TransactionType.DEPOSIT,
              amount: 1000,
              timestamp: new Date(Date.now() - 86400000 * 7), // 7 days ago
              description: 'Initial deposit',
              balanceAfter: 1000,
              percentChange: 100
            },
            {
              id: '2',
              type: TransactionType.MATCH_WIN,
              amount: 250,
              timestamp: new Date(Date.now() - 86400000 * 5), // 5 days ago
              description: 'Match win bonus',
              balanceAfter: 1250,
              percentChange: 25
            },
            {
              id: '3',
              type: TransactionType.MATCH_LOSS,
              amount: -100,
              timestamp: new Date(Date.now() - 86400000 * 3), // 3 days ago
              description: 'Match loss deduction',
              balanceAfter: 1150,
              percentChange: -8
            },
            {
              id: '4',
              type: TransactionType.WITHDRAWAL,
              amount: -500,
              timestamp: new Date(Date.now() - 86400000), // 1 day ago
              description: 'Withdrawal to USDT',
              balanceAfter: 650,
              percentChange: -43.48
            },
            {
              id: '5',
              type: TransactionType.DEPOSIT,
              amount: 300,
              timestamp: new Date(),
              description: 'Deposit from Binance',
              balanceAfter: 950,
              percentChange: 46.15
            }
          ];
          
          updateTransactions(mockTransactions);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load transaction history.",
        });
      }
    };
    
    fetchTransactions();
  }, [toast, updateTransactions, transactions.length]);
  
  // Filter transactions based on selected filter
  useEffect(() => {
    let filtered = [...transactions];
    
    switch (filter) {
      case 'deposits':
        filtered = transactions.filter(t => 
          t.type === TransactionType.DEPOSIT || t.amount > 0
        );
        break;
      case 'withdrawals':
        filtered = transactions.filter(t => 
          t.type === TransactionType.WITHDRAWAL || t.amount < 0
        );
        break;
      default:
        break;
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    setFilteredTransactions(filtered);
  }, [filter, transactions]);
  
  // Handle currency toggle
  const handleCurrencyToggle = (checked: boolean) => {
    setIsUSDT(checked);
  };
  
  // Handle withdrawal
  const handleWithdraw = () => {
    if (balance < 100) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You need at least 100 coins to withdraw.",
      });
      return;
    }
    
    toast({
      title: "Coming Soon",
      description: "Withdrawal functionality will be available soon!",
    });
  };
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Funds</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-6 shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">Balance</h3>
            <div className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded">
              {/* Example percentage change */}
              +15%
            </div>
          </div>
          <div className="text-3xl font-bold">
            {isUSDT ? formatCurrency(balance / 100, 'usd') : formatCurrency(balance)}
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">Total Deposited</h3>
          </div>
          <div className="text-3xl font-bold">
            {isUSDT ? formatCurrency(totalDeposited / 100, 'usd') : formatCurrency(totalDeposited)}
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">Total Withdrawn</h3>
          </div>
          <div className="text-3xl font-bold">
            {isUSDT ? formatCurrency(totalWithdrawn / 100, 'usd') : formatCurrency(totalWithdrawn)}
          </div>
        </div>
      </div>
      
      {/* Currency Toggle */}
      <div className="flex items-center space-x-2">
        <Label htmlFor="currency-toggle" className={!isUSDT ? 'font-semibold' : ''}>
          Game Coins
        </Label>
        <Switch
          id="currency-toggle"
          checked={isUSDT}
          onCheckedChange={handleCurrencyToggle}
        />
        <Label htmlFor="currency-toggle" className={isUSDT ? 'font-semibold' : ''}>
          USDT
        </Label>
        <div className="text-xs text-muted-foreground ml-2">
          (100 Coins = $1)
        </div>
      </div>
      
      {/* Transactions Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Transactions</h2>
          
          <div className="flex space-x-2">
            <div className="flex bg-muted rounded-md p-1">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs h-7"
              >
                All
              </Button>
              <Button
                variant={filter === 'deposits' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('deposits')}
                className="text-xs h-7"
              >
                Deposits
              </Button>
              <Button
                variant={filter === 'withdrawals' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('withdrawals')}
                className="text-xs h-7"
              >
                Withdrawals
              </Button>
            </div>
            
            <Button onClick={handleWithdraw} size="sm" className="h-9">
              Withdraw
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/deposit'} 
              size="sm" 
              className="h-9 bg-arena-gold hover:bg-yellow-600 text-black"
            >
              <Plus className="h-4 w-4 mr-1" /> Deposit
            </Button>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      {formatDate(transaction.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.type}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.description}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${transaction.amount >= 0 ? 'text-arena-success' : 'text-arena-error'}`}>
                      {transaction.amount >= 0 ? '+' : ''}
                      {isUSDT 
                        ? formatCurrency(transaction.amount / 100, 'usd') 
                        : formatCurrency(transaction.amount)
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isUSDT 
                        ? formatCurrency(transaction.balanceAfter / 100, 'usd') 
                        : formatCurrency(transaction.balanceAfter)
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={`inline-flex items-center ${transaction.percentChange >= 0 ? 'text-arena-success' : 'text-arena-error'}`}>
                        {transaction.percentChange >= 0 ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(transaction.percentChange).toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
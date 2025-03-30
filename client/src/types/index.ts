export enum MatchType {
    SUPER = 'Super',
    MASTER = 'Master',
    LEGEND = 'Legend'
  }
  
  export enum MatchResult {
    WIN = 'Win',
    LOSS = 'Loss',
    PENDING = 'Pending',
    CANCELLED = 'Cancelled'
  }
  
  export enum TransactionType {
    DEPOSIT = 'Deposit',
    WITHDRAWAL = 'Withdrawal',
    MATCH_WIN = 'Match Win',
    MATCH_LOSS = 'Match Loss',
    SYSTEM = 'System'
  }
  
  export interface Player {
    id: string;
    username: string;
    teamName: string;
    winRate: number;
    recentResults: MatchResult[];
  }
  
  export interface Match {
    id: string;
    type: MatchType;
    amount: number;
    result: MatchResult;
    created: Date;
    completed?: Date;
    player1: Player;
    player2?: Player;
    score?: [number, number];
    topScorers?: string[];
    matchCode?: string;
  }
  
  export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    timestamp: Date;
    description: string;
    balanceAfter: number;
    percentChange: number;
  }
  
  export interface Report {
    id: string;
    userId: string;
    issue: string;
    email: string;
    created: Date;
    status: 'Pending' | 'Resolved' | 'Rejected';
    evidence?: string;
  }
  
  export interface UserProfile {
    id: string;
    dlsId: string;
    firstName: string;
    email: string;
    teamName: string;
    totalGames: number;
    gamesWon: number;
    gamesLost: number;
    balance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    stripeConnected: boolean;
    binanceConnected: boolean;
    created: Date;
  }
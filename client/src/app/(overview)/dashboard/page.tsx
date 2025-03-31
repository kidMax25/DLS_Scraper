'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import RecentMatchCard from '@/components/cards/recent-match-card';
import QuickStatsCard from '@/components/cards/quick-stats-card';
import JoinMatchCard from '@/components/cards/join-match-card';
import BelieveGameCard from '@/components/cards/believe-game-card';
import MatchHistoryTable from '@/components/match-history-table';
import Leaderboard from '@/components/leaderboard';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome message */}
      <div className="flex flex-col gap-6">
        <div className="lg:w-full">
          <div className="rounded-xl bg-gradient-to-br from-background to-muted p-6 shadow">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="md:w-1/2">
                <h1 className="text-3xl font-bold mb-2">
                  Welcome, {user?.first_name || 'Player'}
                </h1>
                <p className="text-muted-foreground">Get in The Game</p>
              </div>
              <div className="md:w-64 quick-stats-wrapper">
                <div className="transparent-stats">
                  <QuickStatsCard />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RecentMatchCard />
          <JoinMatchCard />
          <BelieveGameCard />
        </div>
      </div>

      {/* Match history table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Match History</h2>
        <MatchHistoryTable matches={matches} />
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Top Earners</h2>
        <Leaderboard />
      </div>
    </div>
  );
}
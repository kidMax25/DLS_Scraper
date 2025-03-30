'use client';

import { useEffect, useState } from 'react';
import useStore from '@/store';
import { calculateWinRate } from '@/lib/utils';
import { apiCall } from '@/lib/utils';

const QuickStatsCard = () => {
  const teamName = useStore((state) => state.teamName);
  const matchHistory = useStore((state) => state.matchHistory);
  const [stats, setStats] = useState({
    totalGames: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // You can either calculate stats from match history or fetch from API
        if (matchHistory.length > 0) {
          const totalGames = matchHistory.length;
          const gamesWon = matchHistory.filter(match => match.result === 'Win').length;
          const gamesLost = matchHistory.filter(match => match.result === 'Loss').length;
          const winRate = calculateWinRate(gamesWon, totalGames);
          
          setStats({
            totalGames,
            gamesWon,
            gamesLost,
            winRate
          });
        } else {
          // Alternatively, fetch stats from API
          const statsData = await apiCall('/api/user/stats');
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, [matchHistory]);
  
  return (
    <div className="rounded-xl border bg-card p-6 shadow hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg mb-2">{teamName || 'Team'} Stats</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Games</span>
          <span className="font-semibold">{stats.totalGames}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Games Won</span>
          <span className="font-semibold text-arena-success">{stats.gamesWon}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Games Lost</span>
          <span className="font-semibold text-arena-error">{stats.gamesLost}</span>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-bold text-lg">{stats.winRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;
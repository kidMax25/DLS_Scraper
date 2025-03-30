'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiCall } from '@/lib/utils';

interface LeaderboardPlayer {
  id: string;
  firstName: string;
  teamName: string;
  totalEarnings: number;
  rank: number;
}

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // In a real app, fetch from API
        // const data = await apiCall('/api/leaderboard');
        // setLeaders(data);
        
        // For demo, use mock data
        setTimeout(() => {
          setLeaders([
            { id: '1', firstName: 'Alex', teamName: 'Lightning FC', totalEarnings: 25000, rank: 1 },
            { id: '2', firstName: 'Jordan', teamName: 'Thunder United', totalEarnings: 19500, rank: 2 },
            { id: '3', firstName: 'Taylor', teamName: 'Royal Stars', totalEarnings: 18200, rank: 3 },
            { id: '4', firstName: 'Casey', teamName: 'Phoenix Athletics', totalEarnings: 15800, rank: 4 },
            { id: '5', firstName: 'Riley', teamName: 'Silver Knights', totalEarnings: 12400, rank: 5 },
          ]);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);
  
  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow text-center">
        <p className="text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }
  
  // Get color class based on rank
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-arena-gold text-black';
      case 2:
        return 'bg-gray-300 text-black';
      case 3:
        return 'bg-amber-700 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  return (
    <div className="rounded-xl border bg-card shadow overflow-hidden">
      <div className="grid grid-cols-1 divide-y">
        {leaders.map((player) => (
          <div key={player.id} className="flex items-center p-4 hover:bg-muted/50">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-4 font-bold text-sm ${getRankColor(player.rank)}`}>
              {player.rank}
            </div>
            
            <Avatar className="mr-4">
              <AvatarFallback className="bg-arena-blue text-white">
                {player.firstName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="font-semibold">{player.teamName}</div>
              <div className="text-sm text-muted-foreground">{player.firstName}</div>
            </div>
            
            <div className="font-bold">{player.totalEarnings.toLocaleString()} Coins</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
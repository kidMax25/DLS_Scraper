'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import useStore from '@/store';
import { MatchResult } from '@/types';
import { formatDate } from '@/lib/utils';

const RecentMatchCard = () => {
  const router = useRouter();
  const matchHistory = useStore((state) => state.matchHistory);
  
  // Get the most recent match
  const recentMatch = matchHistory.length > 0 ? matchHistory[0] : null;
  
  // If no recent match is available
  if (!recentMatch) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow hover:shadow-md transition-shadow">
        <h3 className="font-semibold text-lg mb-2">Recent Match</h3>
        <div className="h-36 flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            No recent matches found.<br />
            Join a match to get started!
          </p>
        </div>
      </div>
    );
  }
  
  // Get the result styling based on match result
  const getResultStyle = () => {
    switch (recentMatch.result) {
      case MatchResult.WIN:
        return 'text-arena-success';
      case MatchResult.LOSS:
        return 'text-arena-error';
      default:
        return 'text-muted-foreground';
    }
  };
  
  return (
    <div className="rounded-xl border bg-card p-6 shadow hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg mb-2">Recent Match</h3>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            {formatDate(recentMatch.created)}
          </span>
          <span className={`font-semibold ${getResultStyle()}`}>
            {recentMatch.result}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="font-semibold">{recentMatch.player1.teamName}</div>
            <div className="text-2xl font-bold">
              {recentMatch.score ? recentMatch.score[0] : '-'}
            </div>
          </div>
          
          <div className="text-muted-foreground">vs</div>
          
          <div className="text-center">
            <div className="font-semibold">
              {recentMatch.player2 ? recentMatch.player2.teamName : 'Opponent'}
            </div>
            <div className="text-2xl font-bold">
              {recentMatch.score ? recentMatch.score[1] : '-'}
            </div>
          </div>
        </div>
      </div>
      
      {recentMatch.topScorers && recentMatch.topScorers.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">Top Scorers:</p>
          <p className="text-sm">{recentMatch.topScorers.join(', ')}</p>
        </div>
      )}
      
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => router.push(`/matches/${recentMatch.id}`)}
      >
        View Match Details
      </Button>
    </div>
  );
};

export default RecentMatchCard;
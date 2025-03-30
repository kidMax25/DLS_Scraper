'use client';

import { useRouter } from 'next/navigation';
import { Match, MatchResult, MatchType } from '@/types';
import { formatDate } from '@/lib/utils';

interface MatchHistoryTableProps {
  matches: Match[];
}

const MatchHistoryTable = ({ matches }: MatchHistoryTableProps) => {
  const router = useRouter();
  
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow text-center">
        <p className="text-muted-foreground">No match history available</p>
      </div>
    );
  }
  
  // Get color based on match type
  const getTypeColor = (type: MatchType) => {
    switch (type) {
      case MatchType.SUPER:
        return 'text-arena-gold';
      case MatchType.MASTER:
        return 'text-arena-blue';
      case MatchType.LEGEND:
        return 'text-arena-orange';
      default:
        return '';
    }
  };
  
  // Get color based on match result
  const getResultColor = (result: MatchResult) => {
    switch (result) {
      case MatchResult.WIN:
        return 'text-arena-success';
      case MatchResult.LOSS:
        return 'text-arena-error';
      case MatchResult.PENDING:
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };
  
  return (
    <div className="rounded-xl border bg-card shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Opponent</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Score</th>
              <th className="px-4 py-3 text-left font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr 
                key={match.id} 
                className="border-b hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/matches/${match.id}`)}
              >
                <td className="px-4 py-3">{formatDate(match.created)}</td>
                <td className="px-4 py-3">
                  {match.player2 ? match.player2.teamName : 'Unknown'}
                </td>
                <td className={`px-4 py-3 font-medium ${getTypeColor(match.type)}`}>
                  {match.type}
                </td>
                <td className="px-4 py-3">{match.amount} Coins</td>
                <td className="px-4 py-3">
                  {match.score ? `${match.score[0]} - ${match.score[1]}` : '-'}
                </td>
                <td className={`px-4 py-3 font-medium ${getResultColor(match.result)}`}>
                  {match.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchHistoryTable;
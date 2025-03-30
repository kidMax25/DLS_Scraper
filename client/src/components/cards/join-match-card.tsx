'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useStore from '@/store';
import { generateMatchCode } from '@/lib/utils';
import { MatchType } from '@/types';

const JoinMatchCard = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [matchCode, setMatchCode] = useState('');
  const [showTierModal, setShowTierModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const balance = useStore((state) => state.balance);
  const setCurrentMatch = useStore((state) => state.setCurrentMatch);
  
  const handleJoinCustomMatch = () => {
    if (!matchCode) {
      toast({
        variant: "destructive",
        title: "Match code required",
        description: "Please enter a valid match code.",
      });
      return;
    }
    
    if (balance < 200) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You need at least 200 coins to join a match. Deposit funds first.",
      });
      return;
    }
    
    // Navigate to the match page with the code
    router.push(`/matches/join/${matchCode}`);
  };
  
  const handleCreateRandomMatch = () => {
    if (balance < 200) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You need at least 200 coins to create a match. Deposit funds first.",
      });
      return;
    }
    
    setShowTierModal(true);
  };
  
  const handleSelectTier = async (tier: MatchType) => {
    setLoading(true);
    
    try {
      // Check minimum balance requirements for each tier
      let minimumBalance = 0;
      let betAmount = 0;
      
      switch (tier) {
        case MatchType.SUPER:
          minimumBalance = 200;
          betAmount = 50;
          break;
        case MatchType.MASTER:
          minimumBalance = 500;
          betAmount = 250;
          break;
        case MatchType.LEGEND:
          minimumBalance = 750; 
          betAmount = 500;
          break;
      }
      
      if (balance < minimumBalance) {
        toast({
          variant: "destructive",
          title: "Insufficient balance",
          description: `You need at least ${minimumBalance} coins to join a ${tier} match.`,
        });
        setShowTierModal(false);
        setLoading(false);
        return;
      }
      
      // Generate a new match code
      const newCode = generateMatchCode();
      
      // In a real app, you would save this to the backend
      // const response = await apiCall('/api/matches/create', 'POST', {
      //   type: tier,
      //   betAmount,
      //   matchCode: newCode
      // });
      
      // For now, just simulate success
      setTimeout(() => {
        setCurrentMatch({
          id: `match-${Date.now()}`,
          type: tier,
          amount: betAmount,
          result: 'Pending',
          created: new Date(),
          player1: {
            id: 'player1',
            username: 'You',
            teamName: useStore.getState().teamName || 'Your Team',
            winRate: 0,
            recentResults: []
          },
          matchCode: newCode
        });
        
        setShowTierModal(false);
        setLoading(false);
        router.push(`/matches/waiting/${newCode}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error creating match:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create match. Please try again.",
      });
      setShowTierModal(false);
      setLoading(false);
    }
  };
  
  return (
    <div className="rounded-xl border bg-card p-6 shadow hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg mb-4">Join a Match</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Custom Match
          </label>
          <div className="flex space-x-2">
            <Input
              value={matchCode}
              onChange={(e) => setMatchCode(e.target.value.toUpperCase())}
              placeholder="Enter match code"
              className="uppercase"
              maxLength={6}
            />
            <Button onClick={handleJoinCustomMatch}>Join</Button>
          </div>
        </div>
        
        <div className="pt-2">
          <Button
            variant="secondary"
            className="w-full bg-arena-gold hover:bg-yellow-600 text-black"
            onClick={handleCreateRandomMatch}
          >
            Create Random Match
          </Button>
        </div>
      </div>
      
      {/* Match Tier Selection Modal */}
      <Dialog open={showTierModal} onOpenChange={setShowTierModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Match Tier</DialogTitle>
            <DialogDescription>
              Choose the tier for your match. Higher tiers require more coins but offer bigger rewards.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Button
              variant="outline"
              className="w-full justify-between items-center h-16"
              onClick={() => handleSelectTier(MatchType.SUPER)}
              disabled={loading || balance < 200}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-arena-gold mr-3"></div>
                <span>Super Tier</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">50 Coins Bet</div>
                <div className="text-xs text-muted-foreground">Min: 200 Coins</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-between items-center h-16"
              onClick={() => handleSelectTier(MatchType.MASTER)}
              disabled={loading || balance < 500}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-arena-blue mr-3"></div>
                <span>Master Tier</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">250 Coins Bet</div>
                <div className="text-xs text-muted-foreground">Min: 500 Coins</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-between items-center h-16"
              onClick={() => handleSelectTier(MatchType.LEGEND)}
              disabled={loading || balance < 750}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-arena-orange mr-3"></div>
                <span>Legend Tier</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">500 Coins Bet</div>
                <div className="text-xs text-muted-foreground">Min: 750 Coins</div>
              </div>
            </Button>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTierModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JoinMatchCard;
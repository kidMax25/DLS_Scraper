'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useStore from '@/store';

const BelieveGameCard = () => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [selectedOption, setSelectedOption] = useState<'left' | 'right' | null>(null);
  
  const balance = useStore((state) => state.balance);
  const updateBalanceBy = useStore((state) => state.updateBalanceBy);
  
  const handleStartGame = () => {
    if (balance < 50) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You need at least 50 coins to play this game.",
      });
      return;
    }
    
    setIsPlaying(true);
    setResult(null);
    setSelectedOption(null);
  };
  
  const handleSelect = (choice: 'left' | 'right') => {
    setSelectedOption(choice);
    
    // Simulate random result (50% chance of winning)
    const win = Math.random() > 0.5;
    
    // Update balance based on result
    if (win) {
      updateBalanceBy(25);
      setResult('win');
      toast({
        title: "You Won!",
        description: "25 coins have been added to your balance.",
        variant: "default",
      });
    } else {
      updateBalanceBy(-50);
      setResult('lose');
      toast({
        variant: "destructive",
        title: "You Lost",
        description: "50 coins have been deducted from your balance.",
      });
    }
    
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };
  
  return (
    <div className="rounded-xl border bg-card p-6 shadow hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg mb-2">Choose to Believe</h3>
      
      <div className="text-sm text-muted-foreground mb-4">
        Pick a side and test your luck! 50 coins to play, win 25 bonus coins.
      </div>
      
      {!isPlaying ? (
        <Button
          variant="outline"
          className="w-full bg-arena-gold hover:bg-yellow-600 text-black"
          onClick={handleStartGame}
        >
          Play Now (50 Coins)
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className={`flex-1 h-20 ${selectedOption === 'left' && result === 'win' ? 'bg-arena-success' : selectedOption === 'left' && result === 'lose' ? 'bg-arena-error' : ''}`}
              onClick={() => handleSelect('left')}
              disabled={selectedOption !== null}
            >
              Left Side
            </Button>
            
            <Button
              variant="outline"
              className={`flex-1 h-20 ${selectedOption === 'right' && result === 'win' ? 'bg-arena-success' : selectedOption === 'right' && result === 'lose' ? 'bg-arena-error' : ''}`}
              onClick={() => handleSelect('right')}
              disabled={selectedOption !== null}
            >
              Right Side
            </Button>
          </div>
          
          {result && (
            <div className={`text-center font-semibold ${result === 'win' ? 'text-arena-success' : 'text-arena-error'}`}>
              {result === 'win' ? 'You Won 25 Coins!' : 'You Lost 50 Coins!'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BelieveGameCard;
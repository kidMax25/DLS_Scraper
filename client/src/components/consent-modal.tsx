'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import useStore from '@/store';
import { useAuth } from '@/context/AuthContext';

export const ConsentModal = () => {
  const [loading, setLoading] = useState(false);
  
  // Get auth context with your custom hook
  const { user: authUser, logout } = useAuth();
  
  // Using your existing Zustand store
  const user = useStore((state) => state.user);
  const showConsentModal = useStore((state) => state.showConsentModal);
  const setShowConsentModal = useStore((state) => state.setShowConsentModal);

  const handleAccept = () => {
    setLoading(true);
    localStorage.setItem('consent-accepted', 'true');
    setShowConsentModal(false);
    setLoading(false);
  };

  const handleDecline = async () => {
    setLoading(true);
    if (authUser) {
      // Log the user out using the auth context
      await logout();
    }
    setShowConsentModal(false);
    setLoading(false);
    window.location.href = '/';
  };

  // If the modal isn't supposed to be shown, don't render it
  if (!showConsentModal) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleDecline()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
          <DialogDescription>
            Before you proceed, please read and accept our terms of service.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-60 overflow-y-auto text-sm">
          <p className="mb-4">
            Welcome to Legends Arena! By accessing our platform, you agree to the following terms:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Legends Arena is a gaming platform for Dream League Soccer (DLS) players.
            </li>
            <li>
              You must be at least 18 years old to use our services.
            </li>
            <li>
              All transactions on the platform are final.
            </li>
            <li>
              We may collect data about your usage for improving our services.
            </li>
            <li>
              Abusive behavior towards other players will result in account termination.
            </li>
            <li>
              Legends Arena is not affiliated with the official Dream League Soccer game.
            </li>
            <li>
              We reserve the right to modify these terms at any time.
            </li>
          </ul>
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDecline}
            disabled={loading}
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={loading}
            className="bg-arena-gold hover:bg-yellow-600 text-black"
          >
            Accept Terms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
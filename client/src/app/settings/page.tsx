'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Wallet, AlertCircle } from 'lucide-react';
import useStore from '@/store';
import { apiCall } from '@/lib/utils';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // State for form fields
  const [dlsId, setDlsId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Get user state from store
  const user = useStore((state) => state.user);
  const storeDlsId = useStore((state) => state.dlsId);
  const setStoreDlsId = useStore((state) => state.setDlsId);
  const hasDlsId = useStore((state) => state.hasDlsId);
  const moneyAccountConnected = useStore((state) => state.moneyAccountConnected);
  const toggleMoneyAccountConnection = useStore((state) => state.toggleMoneyAccountConnection);
  
  // Initialize form fields when component mounts
  useEffect(() => {
    setDlsId(storeDlsId || '');
    setEmail(user?.email || '');
  }, [user, storeDlsId]);
  
  // Handle DLSID update
  const handleUpdateDlsId = async () => {
    if (!dlsId) {
      toast({
        variant: "destructive",
        title: "DLSID Required",
        description: "Please enter a valid DLSID.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, update via API
      // await apiCall('/api/user/update-dlsid', 'POST', { dlsId });
      
      // For demo, just update the store
      setStoreDlsId(dlsId);
      
      toast({
        title: "DLSID Updated",
        description: "Your DLSID has been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update DLSID. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password update
  const handleUpdatePassword = async () => {
    if (!password || !newPassword) {
      toast({
        variant: "destructive",
        title: "Fields Required",
        description: "Both current and new password fields are required.",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "New password must be at least 8 characters long.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, update via API
      // await apiCall('/api/user/update-password', 'POST', { 
      //   currentPassword: password,
      //   newPassword 
      // });
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      
      // Clear the password fields
      setPassword('');
      setNewPassword('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update password. Please ensure your current password is correct.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle account connection toggle
  const handleToggleAccount = (type: 'stripe' | 'binance') => {
    setLoading(true);
    
    try {
      // In a real app, connect/disconnect via API
      // if (!moneyAccountConnected) {
      //   // Logic to connect account
      //   window.location.href = `/connect/${type}`;
      // } else {
      //   // Logic to disconnect account
      //   await apiCall(`/api/user/disconnect-${type}`, 'POST');
      // }
      
      // For demo, just toggle the state
      setTimeout(() => {
        toggleMoneyAccountConnection();
        
        toast({
          title: moneyAccountConnected ? "Account Disconnected" : "Account Connected",
          description: `Your ${type === 'stripe' ? 'Stripe' : 'Binance'} account has been ${moneyAccountConnected ? 'disconnected' : 'connected'}.`,
        });
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: `Failed to ${moneyAccountConnected ? 'disconnect' : 'connect'} account. Please try again.`,
      });
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* DLSID Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dream League Soccer ID</h2>
          
          {!hasDlsId && (
            <div className="flex items-center text-arena-error">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Required</span>
            </div>
          )}
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dlsid">DLSID</Label>
            <div className="flex space-x-2">
              <Input
                id="dlsid"
                value={dlsId}
                onChange={(e) => setDlsId(e.target.value)}
                placeholder="Enter your Dream League Soccer ID"
              />
              <Button 
                onClick={handleUpdateDlsId} 
                disabled={loading || dlsId === storeDlsId}
              >
                Update
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your DLSID is required to participate in matches.
            </p>
          </div>
        </div>
      </div>
      
      {/* Account Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Account</h2>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled={true}
              readOnly
            />
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                />
              </div>
              
              <Button
                onClick={handleUpdatePassword}
                disabled={loading || !password || !newPassword}
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Connections Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Payment Connections</h2>
          
          {!moneyAccountConnected && (
            <div className="flex items-center text-arena-error">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Required</span>
            </div>
          )}
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Stripe</h3>
                <p className="text-sm text-muted-foreground">Connect to deposit funds using credit card</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Switch
                id="stripe-connected"
                checked={moneyAccountConnected}
                onCheckedChange={() => handleToggleAccount('stripe')}
                disabled={loading}
              />
              <Label htmlFor="stripe-connected" className="ml-2">
                {moneyAccountConnected ? 'Connected' : 'Disconnected'}
              </Label>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Wallet className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Binance</h3>
                <p className="text-sm text-muted-foreground">Connect to deposit or withdraw using crypto</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Switch
                id="binance-connected"
                checked={moneyAccountConnected}
                onCheckedChange={() => handleToggleAccount('binance')}
                disabled={loading}
              />
              <Label htmlFor="binance-connected" className="ml-2">
                {moneyAccountConnected ? 'Connected' : 'Disconnected'}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
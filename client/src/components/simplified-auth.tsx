'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import supabase from '@/lib/supabase';

export default function SimplifiedAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Basic signup with only required fields
      const response = await supabase.auth.signUp({
        email,
        password,
      });

      setResult(response.data);
      setError(response.error);
      console.log('Signup response:', response);
    } catch (err) {
      console.error('Error in signup:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Debug Signup</h2>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <Label htmlFor="debug-email">Email</Label>
          <Input
            id="debug-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="debug-password">Password</Label>
          <Input
            id="debug-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Testing...' : 'Test Signup'}
        </Button>
      </form>
      
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold">Result:</h3>
          <pre className="text-xs mt-2 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-600">Error:</h3>
          <pre className="text-xs mt-2 whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
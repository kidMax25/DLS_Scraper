'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function DebugAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      console.log('Client-side signup attempt with:', email)
      
      // Minimal signup with just email and password
      const supabase = createClient()
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signupError) {
        console.error('Client signup error:', signupError)
        setError(signupError.message)
      } else {
        console.log('Client signup success:', data)
        setResult(data)
      }
    } catch (err: any) {
      console.error('Unexpected client signup error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto my-12 p-8 border rounded shadow">
      <h1 className="text-xl font-bold mb-6">Debug Authentication</h1>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
            minLength={6}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Signing up...' : 'Test Signup'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
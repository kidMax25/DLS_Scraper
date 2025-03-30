'use server'

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';

/**
 * Sign in with email and password
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    // Create a Supabase client with server-side cookies
    const supabase = createServerClient();
    
    console.log('Login attempt with:', email);
    
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return { error: error.message };
    }

    if (!data.session) {
      return { error: 'Failed to create session' };
    }

    // Store session in cookies for persistence
    cookies().set('supabase-auth-token', data.session.access_token, {
      path: '/',
      maxAge: data.session.expires_in,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    console.log('Login successful, session created');

    // Revalidate all pages that might depend on auth state
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected login error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Sign up with email, password and user details
 */
export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const teamName = formData.get('teamName') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  if (!firstName || !teamName) {
    return { error: 'First name and team name are required' };
  }

  try {
    const supabase = createServerClient();
    
    console.log('Signup attempt with:', email);

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          team_name: teamName,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error);
      return { error: error.message };
    }

    console.log('Signup successful, user created:', data.user?.id);

    // Check if email confirmation is required
    if (!data.session) {
      return { 
        success: true, 
        message: 'Please check your email to confirm your account' 
      };
    }

    // If session exists (auto-confirm is enabled), create the profile
    if (data.user) {
      try {
        console.log('Creating profile for user:', data.user.id);
        
        // Create a profile in the database
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            first_name: firstName,
            team_name: teamName,
            email: email,
            balance: 1000,
            total_games: 0,
            games_won: 0,
            games_lost: 0,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      } catch (profileErr) {
        console.error('Profile creation exception:', profileErr);
      }

      // Store session in cookies for persistence
      cookies().set('supabase-auth-token', data.session.access_token, {
        path: '/',
        maxAge: data.session.expires_in,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Revalidate paths
      revalidatePath('/', 'layout');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected signup error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Sign out and clear session
 */
export async function logout() {
  const cookieStore = cookies();
  const supabase = createServerClient();
  
  await supabase.auth.signOut();
  
  // Clear all auth-related cookies
  cookieStore.set('supabase-auth-token', '', { 
    maxAge: 0,
    path: '/'
  });
  
  // Redirect to login page
  redirect('/login');
}
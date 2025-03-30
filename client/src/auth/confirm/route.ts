import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

/**
 * Route handler for email confirmation.
 * This handles the redirect from Supabase after a user clicks
 * the confirmation link in their email.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  // If we don't have the required parameters, redirect to an error page
  if (!token_hash || !type) {
    console.error('Missing token_hash or type in auth confirmation URL');
    return redirect('/login?error=invalid_confirmation_link');
  }

  try {
    console.log('Processing auth confirmation for type:', type);
    const supabase = createServerClient();
    
    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      return redirect('/login?error=invalid_confirmation');
    }

    // After successful verification, check if we have a user to create a profile for
    if (data && data.user) {
      try {
        // Check if a profile already exists for this user
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        // If no profile exists, create one
        if (!existingProfile) {
          const metadata = data.user.user_metadata || {};
          
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            first_name: metadata.first_name || 'User',
            team_name: metadata.team_name || 'Team',
            email: data.user.email,
            balance: 1000,
            total_games: 0,
            games_won: 0,
            games_lost: 0,
          });

          if (profileError) {
            console.error('Error creating profile after confirmation:', profileError);
          } else {
            console.log('Profile created for user:', data.user.id);
          }
        }
      } catch (profileError) {
        console.error('Error handling profile in auth confirmation:', profileError);
      }
    }

    // Redirect to the next page or home page
    return redirect(next);
  } catch (error) {
    console.error('Error in auth confirmation route:', error);
    return redirect('/login?error=confirmation_failed');
  }
}
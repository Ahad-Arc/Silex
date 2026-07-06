import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Check for error parameters from OAuth provider/Supabase
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  if (error || errorCode || errorDescription) {
    let friendlyError = errorDescription || error || 'Authentication failed';
    
    // Map existing account conflicts / cancellation
    if (friendlyError.includes('conflict') || errorCode === 'identity_already_exists' || friendlyError.includes('already exists')) {
      friendlyError = 'An account with this email already exists with a different login provider.';
    } else if (
      friendlyError.toLowerCase().includes('canceled') || 
      friendlyError.toLowerCase().includes('cancelled') || 
      friendlyError.toLowerCase().includes('denied')
    ) {
      friendlyError = 'Google authentication was cancelled.';
    }

    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(friendlyError)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // If we have a successful session, redirect to the desired route
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      let friendlyError = exchangeError.message;
      if (friendlyError.includes('conflict') || friendlyError.includes('already exists')) {
        friendlyError = 'An account with this email already exists with a different login provider.';
      }
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(friendlyError)}`);
    }
  }

  // If there's no code and no error parameters, return a generic error
  return NextResponse.redirect(`${origin}/login?error=Could not exchange code for session`);
}

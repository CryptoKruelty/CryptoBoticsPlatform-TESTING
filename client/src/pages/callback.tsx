import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AuthLayout from "@/components/layouts/AuthLayout";
import { getAuthStatus } from "@/lib/auth";

/**
 * Discord OAuth2 callback page
 * This is where users are redirected after authenticating with Discord
 * The actual authentication is handled server-side, but this page provides
 * feedback and handles redirection after the process completes
 */
export default function DiscordCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  
  // The URL might contain error details from Discord
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorDescription = urlParams.get('error_description');
    
    if (errorDescription) {
      console.error('Discord OAuth error:', errorDescription);
      setError(`Authentication failed: ${errorDescription}`);
    }
  }, []);
  
  // Check authentication status
  useEffect(() => {
    if (error) return; // Don't check if already errored
    
    // First immediate check, then fallback to wait and retry
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        const status = await getAuthStatus();
        
        if (status.authenticated) {
          console.log('Successfully authenticated');
          setLocation('/dashboard');
        } else if (statusCheckCount >= 2) {
          // After 3 attempts (initial + 2 retries), show error
          console.error('Authentication failed after multiple checks');
          setError('Authentication timed out. Please try again.');
        } else {
          // Schedule another check after a delay
          setTimeout(() => {
            setStatusCheckCount(prev => prev + 1);
          }, 2000);
        }
      } catch (err) {
        console.error('Auth status check error:', err);
        setError('An error occurred during authentication. Please try again.');
      }
    };
    
    checkAuth();
  }, [setLocation, statusCheckCount, error]);
  
  return (
    <AuthLayout>
      <div className="bg-card rounded-lg shadow-lg overflow-hidden max-w-md w-full p-8 text-center">
        {error ? (
          <>
            <div className="text-destructive text-5xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-4">{error}</h2>
            <button
              onClick={() => setLocation('/login')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-4">Authenticating with Discord...</h2>
            <p className="text-muted-foreground">
              Please wait while we complete the authentication process. 
              You'll be redirected automatically once complete.
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

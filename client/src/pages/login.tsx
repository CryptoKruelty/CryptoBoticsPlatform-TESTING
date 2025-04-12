import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AuthLayout from "@/components/layouts/AuthLayout";
import { loginWithDiscord } from "@/lib/auth";

/**
 * Login page that handles Discord OAuth authorization
 * Uses the Discord authorization code grant flow
 */
export default function Login() {
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Check authentication status
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/auth/status'],
  });
  
  // Check for error parameters in URL (from Discord OAuth redirect)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      console.error('Discord authentication error:', error, errorDescription);
      setErrorMessage(errorDescription || 'Authentication failed. Please try again.');
    }
  }, []);
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authData?.authenticated) {
      console.log('User already authenticated, redirecting to dashboard');
      setLocation("/dashboard");
    }
  }, [authData, setLocation]);
  
  // Handle Discord login button click
  const handleDiscordLogin = async () => {
    try {
      setErrorMessage(null);
      await loginWithDiscord();
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Failed to start authentication. Please try again.');
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center h-full">
          <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout>
      <div className="bg-card rounded-lg shadow-lg overflow-hidden max-w-md w-full">
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-indigo-500 text-transparent bg-clip-text">
            CryptoBotics
          </h1>
          
          <h2 className="text-2xl font-bold mb-6">
            Welcome Back
          </h2>
          
          <p className="text-muted-foreground mb-8">
            Connect with Discord to manage your cryptocurrency monitoring bots
          </p>
          
          {errorMessage && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {errorMessage}
            </div>
          )}
          
          <button
            onClick={handleDiscordLogin}
            className="w-full py-3 px-4 bg-[#5865F2] text-white rounded-md font-medium hover:bg-[#4752C4] transition-colors flex items-center justify-center shadow-sm"
            aria-label="Login with Discord"
          >
            <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Login with Discord
          </button>
          
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              By logging in, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
            
            <p className="text-xs text-muted-foreground/80 mt-4">
              CryptoBotics is not affiliated with Discord Inc.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

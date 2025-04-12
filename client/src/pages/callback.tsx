import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AuthLayout from "@/components/layouts/AuthLayout";

export default function DiscordCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // The callback is handled by the server, which sets cookies
    // and redirects to /dashboard. If we end up here, something
    // might have gone wrong, or we're in the process of redirecting.
    
    const timeoutId = setTimeout(() => {
      // Check if we're still on the callback page after 5 seconds
      fetch('/auth/status', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.authenticated) {
            setLocation('/dashboard');
          } else {
            setError('Authentication failed. Please try again.');
          }
        })
        .catch(err => {
          console.error('Auth status check error:', err);
          setError('An error occurred during authentication. Please try again.');
        });
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [setLocation]);
  
  return (
    <AuthLayout>
      <div className="bg-discord-lighter rounded-lg shadow-lg overflow-hidden max-w-md w-full p-8 text-center">
        {error ? (
          <>
            <span className="material-icons text-crypto-error text-5xl mb-4">error</span>
            <h2 className="text-xl font-heading font-medium mb-4">{error}</h2>
            <button
              onClick={() => setLocation('/login')}
              className="px-4 py-2 bg-discord-primary text-white rounded-md hover:bg-opacity-90"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-t-transparent border-discord-primary rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-heading font-medium mb-4">Authenticating with Discord...</h2>
            <p className="text-discord-secondary">
              Please wait while we complete the authentication process.
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

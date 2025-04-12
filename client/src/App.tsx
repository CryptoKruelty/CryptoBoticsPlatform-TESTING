import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import DiscordCallback from "@/pages/callback";
import Subscribe from "@/pages/subscribe";
import NotFound from "@/pages/not-found";

function App() {
  // Get authentication status
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/auth/status'],
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Set page title
  useEffect(() => {
    document.title = "CryptoBotics - DeFi Metrics Discord Bots";
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-discord-dark">
        <div className="w-8 h-8 border-4 border-t-transparent border-discord-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/auth/discord/callback" component={DiscordCallback} />
      <Route path="/dashboard">
        {() => authData?.authenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/subscribe">
        {() => authData?.authenticated ? <Subscribe /> : <Login />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;

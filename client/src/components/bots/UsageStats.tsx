import { useQuery } from "@tanstack/react-query";

export default function UsageStats() {
  const { data: bots } = useQuery({
    queryKey: ['/api/bots'],
  });
  
  const { data: profile } = useQuery({
    queryKey: ['/api/user/profile'],
  });
  
  const { data: subscription } = useQuery({
    queryKey: ['/api/user/subscription'],
  });
  
  // Calculate stats
  const activeBots = bots ? bots.filter((bot: any) => bot.status === 'active').length : 0;
  const totalBots = bots ? bots.length : 0;
  
  // Get RPC calls from subscription if available
  const rpcCalls = 3420; // Placeholder value for demo
  
  // Count unique Discord servers
  const discordServers = bots 
    ? [...new Set(bots.map((bot: any) => bot.discordGuildId))].length 
    : 0;
  
  // Get next billing date from subscription
  const getBillingDate = () => {
    if (subscription?.details?.current_period_end) {
      const date = new Date(subscription.details.current_period_end * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return 'N/A';
  };
  
  return (
    <div className="mt-8 p-4 bg-discord-lighter rounded-lg">
      <h2 className="font-heading font-medium text-lg mb-4">Bot Usage Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-discord-light p-3 rounded-md">
          <p className="text-sm text-discord-secondary">Active Bots</p>
          <p className="text-2xl font-medium text-white">
            {activeBots} <span className="text-sm text-discord-secondary">/ 5</span>
          </p>
        </div>
        
        <div className="bg-discord-light p-3 rounded-md">
          <p className="text-sm text-discord-secondary">RPC Calls (Today)</p>
          <p className="text-2xl font-medium text-white">{rpcCalls.toLocaleString()}</p>
        </div>
        
        <div className="bg-discord-light p-3 rounded-md">
          <p className="text-sm text-discord-secondary">Discord Servers</p>
          <p className="text-2xl font-medium text-white">{discordServers}</p>
        </div>
        
        <div className="bg-discord-light p-3 rounded-md">
          <p className="text-sm text-discord-secondary">Next Billing Date</p>
          <p className="text-2xl font-medium text-white">{getBillingDate()}</p>
        </div>
      </div>
    </div>
  );
}

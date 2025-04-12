import { useQuery } from "@tanstack/react-query";
import { getBillingPortalUrl } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionBanner() {
  const { toast } = useToast();
  
  const { data: userData } = useQuery({
    queryKey: ['/api/user/profile'],
  });
  
  const { data: subscription } = useQuery({
    queryKey: ['/api/user/subscription'],
  });
  
  const { mutate: getBillingPortal, isPending } = useMutation({
    mutationFn: async () => {
      const url = await getBillingPortalUrl();
      window.location.href = url;
    },
    onError: (error) => {
      toast({
        title: "Error opening billing portal",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const getSubscriptionStatus = () => {
    if (!subscription) return "Inactive";
    
    switch (subscription.status) {
      case 'active':
        return 'Pro Plan';
      case 'past_due':
        return 'Pro Plan (Past Due)';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Inactive';
    }
  };
  
  // Count active bots
  const { data: bots } = useQuery({
    queryKey: ['/api/bots'],
  });
  
  const activeBots = bots ? bots.filter((bot: any) => bot.status === 'active').length : 0;
  const totalBots = bots ? bots.length : 0;
  
  return (
    <div className="mb-6 bg-discord-lighter rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="font-heading font-medium text-lg">
          Current Subscription: 
          <span className={`ml-2 ${subscription?.status === 'active' ? 'text-crypto-accent' : 'text-crypto-warning'}`}>
            {getSubscriptionStatus()}
          </span>
        </h2>
        <p className="text-discord-secondary">
          You have {activeBots} active {activeBots === 1 ? 'bot' : 'bots'} 
          ({totalBots} total{subscription?.status === 'active' ? ' / 5 allowed' : ''})
        </p>
      </div>
      <div className="mt-3 md:mt-0 flex flex-col md:flex-row md:space-x-3 space-y-2 md:space-y-0">
        <button 
          className="px-4 py-2 bg-discord-light text-white rounded-md hover:bg-opacity-80 focus:outline-none"
          onClick={() => getBillingPortal()}
          disabled={isPending}
        >
          Manage Payment
        </button>
        
        {subscription?.status !== 'active' && (
          <button 
            className="px-4 py-2 border border-crypto-accent text-crypto-accent rounded-md hover:bg-crypto-accent hover:bg-opacity-10 focus:outline-none"
            onClick={() => window.location.href = '/subscribe'}
          >
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
}

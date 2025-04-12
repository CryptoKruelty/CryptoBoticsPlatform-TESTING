import { useQuery, useMutation } from "@tanstack/react-query";
import { getBillingPortalUrl, getBotPrice, formatCurrency } from "@/lib/stripe";
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
        return 'Active';
      case 'past_due':
        return 'Past Due';
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
  
  // Calculate total monthly cost based on active bots
  const calculateTotalCost = () => {
    if (!bots) return 0;
    
    return bots
      .filter((bot: any) => bot.status === 'active')
      .reduce((total: number, bot: any) => {
        return total + getBotPrice(bot.type, bot.updateFrequency);
      }, 0);
  };
  
  const totalMonthlyCost = calculateTotalCost();
  
  return (
    <div className="mb-6 bg-discord-lighter rounded-lg p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading font-medium text-lg">
            Current Subscription: 
            <span className={`ml-2 ${subscription?.status === 'active' ? 'text-crypto-accent' : 'text-crypto-warning'}`}>
              {getSubscriptionStatus()}
            </span>
          </h2>
          <p className="text-discord-secondary">
            You have {activeBots} active {activeBots === 1 ? 'bot' : 'bots'} ({totalBots} total)
          </p>
          {totalMonthlyCost > 0 && (
            <p className="text-crypto-accent">
              Total monthly cost: {formatCurrency(totalMonthlyCost)}
            </p>
          )}
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
              Subscribe
            </button>
          )}
        </div>
      </div>
      
      {/* Cost breakdown section */}
      {activeBots > 0 && (
        <div className="mt-4 pt-4 border-t border-discord-dark">
          <h3 className="font-medium mb-2">Monthly Cost Breakdown:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
            {bots && bots
              .filter((bot: any) => bot.status === 'active')
              .map((bot: any) => {
                const botCost = getBotPrice(bot.type, bot.updateFrequency);
                const basePrice = getBotPrice(bot.type, '60');
                const frequencyCost = botCost - basePrice;
                
                let typeLabel = 'Standard';
                if (bot.type === 'alert_whale' || bot.type === 'alert_buy') {
                  typeLabel = 'Alert';
                } else if (bot.type === 'custom_rpc') {
                  typeLabel = 'Custom RPC';
                }
                
                return (
                  <div key={bot.id} className="bg-discord-light p-2 rounded">
                    <div className="font-medium">{bot.name}</div>
                    <div className="flex justify-between text-discord-secondary">
                      <span>{typeLabel}</span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    {frequencyCost > 0 && (
                      <div className="flex justify-between text-discord-secondary">
                        <span>{bot.updateFrequency}s updates</span>
                        <span>+{formatCurrency(frequencyCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium mt-1 pt-1 border-t border-discord-dark">
                      <span>Total</span>
                      <span>{formatCurrency(botCost)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
          
          <div className="flex justify-between font-medium mt-3 pt-2 border-t border-discord-dark">
            <span>Total Monthly Cost:</span>
            <span className="text-crypto-accent">{formatCurrency(totalMonthlyCost)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

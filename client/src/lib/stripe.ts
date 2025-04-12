import { apiRequest } from "./queryClient";

export interface SubscriptionDetails {
  status: string;
  details: any | null;
}

export const getSubscriptionDetails = async (): Promise<SubscriptionDetails> => {
  try {
    const res = await apiRequest('GET', '/api/user/subscription', undefined);
    return await res.json();
  } catch (error) {
    console.error('Subscription details error:', error);
    throw error;
  }
};

export const getBillingPortalUrl = async (): Promise<string> => {
  try {
    const res = await apiRequest('GET', '/api/user/billing-portal', undefined);
    const { url } = await res.json();
    return url;
  } catch (error) {
    console.error('Billing portal error:', error);
    throw error;
  }
};

export const getBotPrice = (botType: string, updateFrequency: string): number => {
  // Base price by bot type
  let price = 0;
  
  switch (botType) {
    case 'standard':
      price = 5.00;
      break;
    case 'alert_whale':
    case 'alert_buy':
      price = 8.00;
      break;
    case 'custom_rpc':
      price = 11.00;
      break;
    default:
      price = 5.00;
  }
  
  // Add-ons for update frequency
  switch (updateFrequency) {
    case '30':
      price += 2.00;
      break;
    case '15':
      price += 5.00;
      break;
    default:
      // No additional cost for 60 seconds
      break;
  }
  
  return price;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

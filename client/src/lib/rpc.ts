export interface Network {
  id: string;
  name: string;
  icon: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const getNetworks = (): Network[] => {
  return [
    {
      id: 'ethereum',
      name: 'Ethereum Mainnet',
      icon: 'currency_bitcoin'
    },
    {
      id: 'bsc',
      name: 'BSC Mainnet',
      icon: 'currency_exchange'
    },
    {
      id: 'polygon',
      name: 'Polygon',
      icon: 'hexagon'
    },
    {
      id: 'arbitrum',
      name: 'Arbitrum One',
      icon: 'compress'
    }
  ];
};

export const getMetricTypes = (botType: string) => {
  switch (botType) {
    case 'standard':
      return [
        { id: 'price', name: 'Token Price' },
        { id: 'balance', name: 'Wallet Balance' },
        { id: 'supply', name: 'Total Supply' }
      ];
    case 'alert_whale':
      return [
        { id: 'threshold', name: 'Threshold Amount' }
      ];
    case 'alert_buy':
      return [
        { id: 'buys', name: 'Buy Transactions' }
      ];
    case 'custom_rpc':
      return [
        { id: 'custom', name: 'Custom Function' }
      ];
    default:
      return [];
  }
};

export const validateTokenAddress = (address: string): boolean => {
  // Simple regex pattern for Ethereum addresses
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
};

export const validateWalletAddress = (address: string): boolean => {
  // Simple regex pattern for Ethereum addresses
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
};

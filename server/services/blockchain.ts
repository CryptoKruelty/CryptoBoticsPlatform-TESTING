import { storage } from "../storage";

interface RPCResponse {
  id: number;
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

interface NetworkConfig {
  name: string;
  rpcEndpoints: string[];
  chainId: number;
}

class BlockchainService {
  private networks: Record<string, NetworkConfig>;
  private currentEndpoints: Record<string, number>; // Maps network to current endpoint index
  
  constructor() {
    // Initialize network configurations
    this.networks = {
      ethereum: {
        name: "Ethereum Mainnet",
        rpcEndpoints: [
          "https://ethereum.publicnode.com",
          "https://eth.llamarpc.com",
          "https://eth.rpc.blxrbdn.com"
        ],
        chainId: 1
      },
      bsc: {
        name: "Binance Smart Chain",
        rpcEndpoints: [
          "https://bsc-dataseed.binance.org",
          "https://bsc-dataseed1.defibit.io",
          "https://bsc-dataseed1.ninicoin.io"
        ],
        chainId: 56
      },
      polygon: {
        name: "Polygon Mainnet",
        rpcEndpoints: [
          "https://polygon-rpc.com",
          "https://rpc-mainnet.matic.network",
          "https://matic-mainnet.chainstacklabs.com"
        ],
        chainId: 137
      },
      arbitrum: {
        name: "Arbitrum One",
        rpcEndpoints: [
          "https://arb1.arbitrum.io/rpc",
          "https://arbitrum.llamarpc.com",
          "https://arbitrum-one.public.blastapi.io"
        ],
        chainId: 42161
      }
    };
    
    // Initialize current endpoints
    this.currentEndpoints = Object.keys(this.networks).reduce((acc, network) => {
      acc[network] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Schedule daily RPC call counter reset
    this.scheduleDailyRpcReset();
  }
  
  /**
   * Schedules a daily reset of the RPC call counter at midnight
   */
  private scheduleDailyRpcReset() {
    const resetDaily = async () => {
      try {
        await storage.updatePlatformStats({
          dailyRpcCalls: 0
        });
        console.log("Daily RPC call counter reset successfully");
      } catch (error) {
        console.error("Failed to reset daily RPC call counter:", error);
      }
      
      // Schedule next reset
      this.scheduleDailyRpcReset();
    };
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    setTimeout(resetDaily, timeUntilMidnight);
    
    console.log(`Scheduled RPC counter reset in ${Math.round(timeUntilMidnight / 3600000)} hours`);
  }
  
  private async makeRpcCall(network: string, method: string, params: any[]): Promise<any> {
    if (!this.networks[network]) {
      throw new Error(`Unsupported network: ${network}`);
    }
    
    const networkConfig = this.networks[network];
    const endpointIndex = this.currentEndpoints[network];
    const rpcUrl = networkConfig.rpcEndpoints[endpointIndex];
    
    try {
      // Update platform stats
      const stats = await storage.getPlatformStats();
      await storage.updatePlatformStats({
        totalRpcCalls: stats.totalRpcCalls + 1,
        dailyRpcCalls: stats.dailyRpcCalls + 1
      });
      
      const payload = {
        jsonrpc: "2.0",
        id: 1,
        method,
        params
      };
      
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data: RPCResponse = await response.json();
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }
      
      return data.result;
    } catch (error) {
      console.error(`RPC call failed for ${network} using ${rpcUrl}:`, error);
      
      // Try fallback endpoint
      const nextEndpointIndex = (endpointIndex + 1) % networkConfig.rpcEndpoints.length;
      this.currentEndpoints[network] = nextEndpointIndex;
      
      if (nextEndpointIndex !== endpointIndex) {
        return this.makeRpcCall(network, method, params);
      } else {
        throw new Error(`All RPC endpoints failed for ${network}`);
      }
    }
  }
  
  async getEthBalance(network: string, address: string): Promise<string> {
    const balance = await this.makeRpcCall(network, "eth_getBalance", [address, "latest"]);
    return BigInt(balance).toString(10);
  }
  
  async getTokenBalance(network: string, tokenAddress: string, walletAddress: string): Promise<string> {
    // ERC20 balanceOf function selector + address
    const data = `0x70a08231000000000000000000000000${walletAddress.slice(2).padStart(64, '0')}`;
    
    const result = await this.makeRpcCall(network, "eth_call", [{
      to: tokenAddress,
      data
    }, "latest"]);
    
    return BigInt(result).toString(10);
  }
  
  async getTokenSupply(network: string, tokenAddress: string): Promise<string> {
    // ERC20 totalSupply function selector
    const data = "0x18160ddd";
    
    const result = await this.makeRpcCall(network, "eth_call", [{
      to: tokenAddress,
      data
    }, "latest"]);
    
    return BigInt(result).toString(10);
  }
  
  async getGasPrice(network: string): Promise<string> {
    const gasPrice = await this.makeRpcCall(network, "eth_gasPrice", []);
    return BigInt(gasPrice).toString(10);
  }
  
  async callContractFunction(
    network: string, 
    contractAddress: string, 
    functionSignature: string, 
    args: any[] = []
  ): Promise<string> {
    // This is a simplistic implementation
    // A real implementation would properly encode args based on ABI
    const data = `0x${functionSignature}`;
    
    const result = await this.makeRpcCall(network, "eth_call", [{
      to: contractAddress,
      data
    }, "latest"]);
    
    return result;
  }
  
  async getLatestBlock(network: string): Promise<any> {
    return this.makeRpcCall(network, "eth_getBlockByNumber", ["latest", false]);
  }
  
  async getPairPrice(network: string, pairAddress: string): Promise<number> {
    // This is a simplified implementation for common DEX pairs
    // A real implementation would understand common DEX patterns (Uniswap, PancakeSwap, etc.)
    
    // Get pair reserves (function selector for getReserves: 0x0902f1ac)
    const reservesData = await this.makeRpcCall(network, "eth_call", [{
      to: pairAddress,
      data: "0x0902f1ac"
    }, "latest"]);
    
    // Parse reserves - real implementation would decode properly
    // For this example, we just return a placeholder
    return 1843.29; // Placeholder price for ETH
  }
  
  // Helper for whale transaction monitoring (simplified)
  async monitorWhaleTx(network: string, threshold: string): Promise<any[]> {
    // In a real implementation, this would subscribe to new blocks
    // and filter for transactions above the threshold
    
    // For this demo, we'll just return a placeholder
    return [];
  }
}

export const blockchainService = new BlockchainService();

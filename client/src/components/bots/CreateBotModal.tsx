import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getDiscordGuilds, getDiscordChannels } from "@/lib/discord";
import { getNetworks, getMetricTypes, validateTokenAddress } from "@/lib/rpc";
import { getBotPrice, formatCurrency } from "@/lib/stripe";

interface CreateBotModalProps {
  onClose: () => void;
  editBotId: number | null;
}

export default function CreateBotModal({ onClose, editBotId }: CreateBotModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form state
  const [step, setStep] = useState(1);
  const [botType, setBotType] = useState("standard");
  const [botName, setBotName] = useState("");
  const [discordGuild, setDiscordGuild] = useState("");
  const [discordChannel, setDiscordChannel] = useState("");
  const [network, setNetwork] = useState("ethereum");
  const [metricType, setMetricType] = useState("price");
  const [tokenAddress, setTokenAddress] = useState("");
  const [pairAddress, setPairAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [updateFrequency, setUpdateFrequency] = useState("60");
  const [threshold, setThreshold] = useState("100");
  const [customFunction, setCustomFunction] = useState("totalSupply");
  const [functionSignature, setFunctionSignature] = useState("18160ddd");
  
  // Data loading
  const { data: guilds } = useQuery({
    queryKey: ['/api/discord/guilds'],
    queryFn: getDiscordGuilds,
  });
  
  const { data: channels } = useQuery({
    queryKey: ['/api/discord/channels', discordGuild],
    queryFn: () => getDiscordChannels(discordGuild),
    enabled: !!discordGuild,
  });
  
  // For editing existing bot
  const { data: botData, isLoading: isBotLoading } = useQuery({
    queryKey: ['/api/bots', editBotId],
    enabled: !!editBotId,
  });
  
  useEffect(() => {
    if (botData && !isBotLoading) {
      setBotType(botData.type);
      setBotName(botData.name);
      setDiscordGuild(botData.discordGuildId);
      setDiscordChannel(botData.discordChannelId || "");
      setNetwork(botData.network);
      setUpdateFrequency(botData.updateFrequency);
      
      if (botData.tokenAddress) {
        setTokenAddress(botData.tokenAddress);
      }
      
      if (botData.configuration) {
        if (botData.configuration.metricType) {
          setMetricType(botData.configuration.metricType);
        }
        if (botData.configuration.pairAddress) {
          setPairAddress(botData.configuration.pairAddress);
        }
        if (botData.configuration.walletAddress) {
          setWalletAddress(botData.configuration.walletAddress);
        }
        if (botData.configuration.threshold) {
          setThreshold(botData.configuration.threshold);
        }
        if (botData.configuration.functionName) {
          setCustomFunction(botData.configuration.functionName);
        }
        if (botData.configuration.functionSignature) {
          setFunctionSignature(botData.configuration.functionSignature);
        }
      }
    }
  }, [botData, isBotLoading]);
  
  // API mutations
  const createBotMutation = useMutation({
    mutationFn: async (botData: any) => {
      return apiRequest('POST', '/api/bots', botData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot Created",
        description: "Your new bot has been created successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateBotMutation = useMutation({
    mutationFn: async (botData: any) => {
      return apiRequest('PUT', `/api/bots/${editBotId}`, botData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot Updated",
        description: "Your bot has been updated successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = () => {
    // Prepare configuration object based on bot type
    let configuration: any = {};
    
    switch (botType) {
      case 'standard':
        configuration = {
          metricType,
          ...(metricType === 'price' && { pairAddress }),
          ...(metricType === 'balance' && { walletAddress }),
          decimals: 18, // Default, could be configurable
        };
        break;
      case 'alert_whale':
      case 'alert_buy':
        configuration = {
          threshold,
          ...(botType === 'alert_whale' && { minAmount: threshold }),
        };
        break;
      case 'custom_rpc':
        configuration = {
          functionName: customFunction,
          functionSignature,
        };
        break;
    }
    
    // Prepare bot data
    const botData = {
      name: botName,
      type: botType,
      guildId: discordGuild,
      channelId: discordChannel || undefined,
      network,
      tokenAddress: tokenAddress || undefined,
      updateFrequency,
      configuration,
    };
    
    // Create or update bot
    if (editBotId) {
      updateBotMutation.mutate(botData);
    } else {
      createBotMutation.mutate(botData);
    }
  };
  
  const calculatePrice = () => {
    return getBotPrice(botType, updateFrequency);
  };
  
  // Validation
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return !!botType;
      case 2:
        return botName.length >= 3 && !!discordGuild;
      case 3:
        if (botType === 'standard' || botType === 'custom_rpc') {
          if (!validateTokenAddress(tokenAddress)) {
            toast({
              title: "Invalid token address",
              description: "Please enter a valid token address",
              variant: "destructive",
            });
            return false;
          }
          
          if (botType === 'standard' && metricType === 'price' && !validateTokenAddress(pairAddress)) {
            toast({
              title: "Invalid pair address",
              description: "Please enter a valid pair address",
              variant: "destructive",
            });
            return false;
          }
          
          if (botType === 'standard' && metricType === 'balance' && !validateTokenAddress(walletAddress)) {
            toast({
              title: "Invalid wallet address",
              description: "Please enter a valid wallet address",
              variant: "destructive",
            });
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };
  
  const networks = getNetworks();
  const metricOptions = getMetricTypes(botType);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-discord-lighter rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="p-4 border-b border-discord-dark flex justify-between items-center">
          <h2 className="font-heading font-bold text-xl">
            {editBotId ? "Edit Bot" : "Create a New Bot"}
          </h2>
          <button 
            className="p-1 text-discord-secondary hover:text-white focus:outline-none" 
            onClick={onClose}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="p-5">
          {step === 1 && (
            <div className="mb-6">
              <h3 className="font-heading font-medium text-lg mb-4">1. Select Bot Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div 
                  className={`border-2 ${botType === 'standard' ? 'border-discord-primary' : 'border-discord-dark'} bg-discord-light rounded-lg p-3 cursor-pointer`}
                  onClick={() => setBotType('standard')}
                >
                  <div className="flex items-center mb-2">
                    <span className={`material-icons ${botType === 'standard' ? 'text-discord-primary' : 'text-discord-secondary'} mr-2`}>token</span>
                    <span className="font-medium">Standard Bot</span>
                  </div>
                  <p className="text-xs text-discord-secondary">Display metrics like price, supply, or balance</p>
                  <p className={`text-xs ${botType === 'standard' ? 'text-crypto-accent' : 'text-discord-secondary'} mt-2`}>$5.00/month</p>
                </div>
                
                <div 
                  className={`border-2 ${botType === 'alert_whale' ? 'border-discord-primary' : 'border-discord-dark'} bg-discord-light rounded-lg p-3 cursor-pointer`}
                  onClick={() => setBotType('alert_whale')}
                >
                  <div className="flex items-center mb-2">
                    <span className={`material-icons ${botType === 'alert_whale' ? 'text-discord-primary' : 'text-discord-secondary'} mr-2`}>notifications</span>
                    <span className="font-medium">Alert Bot</span>
                  </div>
                  <p className="text-xs text-discord-secondary">Send whale transaction alerts to channels</p>
                  <p className={`text-xs ${botType === 'alert_whale' ? 'text-crypto-accent' : 'text-discord-secondary'} mt-2`}>$9.00/month</p>
                </div>
                
                <div 
                  className={`border-2 ${botType === 'custom_rpc' ? 'border-discord-primary' : 'border-discord-dark'} bg-discord-light rounded-lg p-3 cursor-pointer`}
                  onClick={() => setBotType('custom_rpc')}
                >
                  <div className="flex items-center mb-2">
                    <span className={`material-icons ${botType === 'custom_rpc' ? 'text-discord-primary' : 'text-discord-secondary'} mr-2`}>data_object</span>
                    <span className="font-medium">Custom RPC</span>
                  </div>
                  <p className="text-xs text-discord-secondary">Execute custom smart contract calls</p>
                  <p className={`text-xs ${botType === 'custom_rpc' ? 'text-crypto-accent' : 'text-discord-secondary'} mt-2`}>$5.00/month</p>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="mb-6">
              <h3 className="font-heading font-medium text-lg mb-4">2. Basic Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bot Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                    placeholder="e.g., ETH Price Tracker"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Select Discord Server</label>
                  <select 
                    className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                    value={discordGuild}
                    onChange={(e) => setDiscordGuild(e.target.value)}
                  >
                    <option value="">Select a server</option>
                    {guilds?.map((guild) => (
                      <option key={guild.id} value={guild.id}>{guild.name}</option>
                    ))}
                  </select>
                </div>
                
                {(botType === 'alert_whale' || botType === 'alert_buy') && discordGuild && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Discord Channel</label>
                    <select 
                      className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                      value={discordChannel}
                      onChange={(e) => setDiscordChannel(e.target.value)}
                    >
                      <option value="">Select a channel</option>
                      {channels?.map((channel) => (
                        <option key={channel.id} value={channel.id}>{channel.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Blockchain Network</label>
                  <select 
                    className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                  >
                    {networks.map((net) => (
                      <option key={net.id} value={net.id}>{net.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="mb-6">
              <h3 className="font-heading font-medium text-lg mb-4">3. Metric Configuration</h3>
              <div className="space-y-4">
                {(botType === 'standard' || botType === 'custom_rpc') && (
                  <>
                    {botType === 'standard' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Metric Type</label>
                        <select 
                          className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                          value={metricType}
                          onChange={(e) => setMetricType(e.target.value)}
                        >
                          {metricOptions.map((option) => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {botType === 'custom_rpc' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Function Name</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                          placeholder="e.g., totalSupply"
                          value={customFunction}
                          onChange={(e) => setCustomFunction(e.target.value)}
                        />
                      </div>
                    )}
                    
                    {botType === 'custom_rpc' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Function Signature (hex)</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                          placeholder="e.g., 18160ddd for totalSupply()"
                          value={functionSignature}
                          onChange={(e) => setFunctionSignature(e.target.value)}
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Token Address</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                        placeholder="0x..."
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                      />
                    </div>
                    
                    {botType === 'standard' && metricType === 'price' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Pair Address (for price)</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                          placeholder="0x..."
                          value={pairAddress}
                          onChange={(e) => setPairAddress(e.target.value)}
                        />
                      </div>
                    )}
                    
                    {botType === 'standard' && metricType === 'balance' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Wallet Address</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                          placeholder="0x..."
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}
                
                {(botType === 'alert_whale' || botType === 'alert_buy') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {botType === 'alert_whale' ? 'Minimum Transaction Amount (ETH)' : 'Minimum Buy Amount (ETH)'}
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 bg-discord-light border border-discord-dark rounded-md focus:outline-none focus:ring-2 focus:ring-discord-primary"
                      placeholder="e.g., 100"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Update Frequency</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      className={`border-2 ${updateFrequency === '60' ? 'border-discord-primary' : 'border-discord-dark'} bg-discord-light rounded-lg p-2 text-center cursor-pointer`}
                      onClick={() => setUpdateFrequency('60')}
                    >
                      <p className="font-medium">60 seconds</p>
                      <p className="text-xs text-discord-secondary">Base price</p>
                    </div>
                    
                    <div 
                      className={`border-2 ${updateFrequency === '30' ? 'border-discord-primary' : 'border-discord-dark'} bg-discord-light rounded-lg p-2 text-center cursor-pointer`}
                      onClick={() => setUpdateFrequency('30')}
                    >
                      <p className="font-medium">30 seconds</p>
                      <p className="text-xs text-discord-secondary">+$2.00/mo</p>
                    </div>
                    
                    <div 
                      className={`border-2 ${updateFrequency === '15' ? 'border-discord-primary' : 'border-discord-dark'} bg-discord-light rounded-lg p-2 text-center cursor-pointer`}
                      onClick={() => setUpdateFrequency('15')}
                    >
                      <p className="font-medium">15 seconds</p>
                      <p className="text-xs text-discord-secondary">+$5.00/mo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div>
              <h3 className="font-heading font-medium text-lg mb-4">4. Subscription Summary</h3>
              <div className="bg-discord-light rounded-lg p-3">
                <div className="flex justify-between py-1">
                  <span>{botType === 'standard' ? 'Standard Bot' : botType === 'alert_whale' || botType === 'alert_buy' ? 'Alert Bot' : 'Custom RPC Bot'}</span>
                  <span>{formatCurrency(botType === 'alert_whale' || botType === 'alert_buy' ? 9.00 : 5.00)}/month</span>
                </div>
                <div className="flex justify-between py-1 border-b border-discord-dark">
                  <span>Update frequency ({updateFrequency}s)</span>
                  <span>{updateFrequency === '60' ? 'Included' : formatCurrency(updateFrequency === '30' ? 2.00 : 5.00)}/month</span>
                </div>
                <div className="flex justify-between py-2 font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(calculatePrice())}/month</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-discord-dark flex justify-between">
          {step > 1 ? (
            <button 
              className="px-4 py-2 bg-discord-light text-white rounded-md hover:bg-opacity-80 focus:outline-none"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          ) : (
            <button 
              className="px-4 py-2 bg-discord-light text-white rounded-md hover:bg-opacity-80 focus:outline-none"
              onClick={onClose}
            >
              Cancel
            </button>
          )}
          
          {step < 4 ? (
            <button 
              className="px-4 py-2 bg-discord-primary text-white rounded-md hover:bg-opacity-90 focus:outline-none"
              onClick={() => {
                if (validateStep(step)) {
                  setStep(step + 1);
                }
              }}
            >
              Next
            </button>
          ) : (
            <button 
              className="px-4 py-2 bg-discord-primary text-white rounded-md hover:bg-opacity-90 focus:outline-none"
              onClick={handleSubmit}
              disabled={createBotMutation.isPending || updateBotMutation.isPending}
            >
              {editBotId ? "Update Bot" : "Create Bot"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface BotCardProps {
  bot: {
    id: number;
    name: string;
    type: string;
    status: string;
    network: string;
    discordGuildId: string;
    updateFrequency: string;
    lastValue?: string | null;
    lastUpdated?: string | null;
  };
  onEdit: (botId: number) => void;
}

export default function BotCard({ bot, onEdit }: BotCardProps) {
  const [showActions, setShowActions] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const startMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/bots/${bot.id}/start`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot Started",
        description: `${bot.name} is now running`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/bots/${bot.id}/stop`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot Paused",
        description: `${bot.name} is now paused`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to pause bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const restartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/bots/${bot.id}/restart`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot Restarted",
        description: `${bot.name} has been restarted`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to restart bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/bots/${bot.id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot Deleted",
        description: `${bot.name} has been deleted`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete bot",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getBotTypeDisplay = (type: string) => {
    switch (type) {
      case 'standard': return 'Standard Bot';
      case 'alert_whale': return 'Whale Alert Bot';
      case 'alert_buy': return 'Buy Alert Bot';
      case 'custom_rpc': return 'Custom RPC Bot';
      default: return type;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': 
        return 'bg-crypto-success bg-opacity-20 text-crypto-success';
      case 'paused': 
        return 'bg-discord-secondary bg-opacity-20 text-discord-secondary';
      case 'configured': 
        return 'bg-crypto-warning bg-opacity-20 text-crypto-warning';
      case 'error': 
        return 'bg-crypto-error bg-opacity-20 text-crypto-error';
      default: 
        return 'bg-discord-secondary bg-opacity-20 text-discord-secondary';
    }
  };

  const getNetworkName = (network: string) => {
    switch (network) {
      case 'ethereum': return 'Ethereum Mainnet';
      case 'bsc': return 'BSC Mainnet';
      case 'polygon': return 'Polygon';
      case 'arbitrum': return 'Arbitrum One';
      default: return network;
    }
  };

  const getUpdateFrequency = (frequency: string) => {
    return `Updates every ${frequency} seconds`;
  };

  // Get the correct icon based on bot type
  const getBotTypeIcon = (type: string) => {
    switch (type) {
      case 'standard': return 'token';
      case 'alert_whale': 
      case 'alert_buy': 
        return 'notifications';
      case 'custom_rpc': return 'data_object';
      default: return 'smart_toy';
    }
  };

  return (
    <div className="bg-discord-lighter rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-discord-dark">
        <div className="flex justify-between items-start">
          <div>
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(bot.status)}`}>
              {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
            </span>
            <h3 className="mt-1 font-heading font-medium text-lg">{bot.name}</h3>
            <p className="text-sm text-discord-secondary">{getBotTypeDisplay(bot.type)}</p>
          </div>
          <div className="flex">
            <button 
              className="p-1.5 text-discord-secondary hover:text-white focus:outline-none" 
              title="Edit Bot"
              onClick={() => onEdit(bot.id)}
            >
              <span className="material-icons text-sm">edit</span>
            </button>
            <button 
              className="p-1.5 text-discord-secondary hover:text-white focus:outline-none" 
              title="More Options"
              onClick={() => setShowActions(!showActions)}
            >
              <span className="material-icons text-sm">more_vert</span>
            </button>
            
            {showActions && (
              <div className="absolute mt-8 right-0 w-48 rounded-md shadow-lg bg-discord-light ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-discord-lighter"
                    role="menuitem"
                    onClick={() => {
                      deleteMutation.mutate();
                      setShowActions(false);
                    }}
                  >
                    <span className="material-icons text-sm inline-block mr-2 align-text-bottom">delete</span>
                    Delete Bot
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="material-icons text-discord-secondary mr-2">{getBotTypeIcon(bot.type)}</span>
            <span className="text-sm">
              {bot.type === 'standard' && bot.lastValue 
                ? <>{bot.lastValue}</>
                : bot.type === 'alert_whale' 
                  ? 'Alerts for whale transactions'
                  : bot.type === 'alert_buy'
                    ? 'Alerts for buy transactions'
                    : bot.type === 'custom_rpc'
                      ? 'Custom contract call'
                      : 'No data yet'
              }
            </span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-discord-secondary mr-2">schedule</span>
            <span className="text-sm">{getUpdateFrequency(bot.updateFrequency)}</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-discord-secondary mr-2">dns</span>
            <span className="text-sm">{getNetworkName(bot.network)}</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-discord-secondary mr-2">group</span>
            <span className="text-sm">
              {bot.discordGuildId === '1234567890' 
                ? 'Crypto Traders Guild' 
                : bot.discordGuildId === '0987654321'
                  ? 'DeFi Enthusiasts'
                  : `Discord Server`
              }
            </span>
          </div>
          {bot.lastUpdated && (
            <div className="flex items-center">
              <span className="material-icons text-discord-secondary mr-2">update</span>
              <span className="text-sm">Last updated: {new Date(bot.lastUpdated).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-discord-dark flex justify-between">
          {bot.status === 'active' ? (
            <>
              <button 
                className="inline-flex items-center px-3 py-1.5 bg-discord-light text-white rounded-md hover:bg-opacity-80 focus:outline-none"
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
              >
                <span className="material-icons mr-1 text-sm">pause</span>
                Pause
              </button>
              <button 
                className="inline-flex items-center px-3 py-1.5 bg-discord-light text-white rounded-md hover:bg-opacity-80 focus:outline-none"
                onClick={() => restartMutation.mutate()}
                disabled={restartMutation.isPending}
              >
                <span className="material-icons mr-1 text-sm">refresh</span>
                Restart
              </button>
            </>
          ) : (
            <>
              <button 
                className="inline-flex items-center px-3 py-1.5 bg-crypto-success text-white rounded-md hover:bg-opacity-80 focus:outline-none"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                <span className="material-icons mr-1 text-sm">play_arrow</span>
                Start
              </button>
              <button 
                className="inline-flex items-center px-3 py-1.5 bg-crypto-error text-white rounded-md hover:bg-opacity-80 focus:outline-none"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this bot?')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <span className="material-icons mr-1 text-sm">delete</span>
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

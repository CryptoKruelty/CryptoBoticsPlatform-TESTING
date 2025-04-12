import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BotCard from "./BotCard";
import CreateBotCard from "./CreateBotCard";
import CreateBotModal from "./CreateBotModal";
import BotStatusFilter from "./BotStatusFilter";
import { useToast } from "@/hooks/use-toast";

export default function BotList() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editBotId, setEditBotId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: bots, isLoading, error } = useQuery({
    queryKey: ['/api/bots'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="w-8 h-8 border-4 border-t-transparent border-discord-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error loading bots",
      description: "Failed to load your bots. Please try again later.",
      variant: "destructive",
    });
    
    return (
      <div className="text-center my-8 text-crypto-error">
        <span className="material-icons text-3xl">error</span>
        <p className="mt-2">Failed to load bots. Please try again later.</p>
      </div>
    );
  }

  const filteredBots = filterStatus === "all" 
    ? bots 
    : bots.filter((bot: any) => bot.status === filterStatus);

  const handleEditBot = (botId: number) => {
    setEditBotId(botId);
    setShowCreateModal(true);
  };

  return (
    <div>
      <BotStatusFilter currentStatus={filterStatus} onStatusChange={setFilterStatus} />
      
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredBots.map((bot: any) => (
          <BotCard key={bot.id} bot={bot} onEdit={handleEditBot} />
        ))}
        
        <CreateBotCard onClick={() => {
          setEditBotId(null);
          setShowCreateModal(true);
        }} />
      </div>

      {showCreateModal && (
        <CreateBotModal 
          onClose={() => setShowCreateModal(false)} 
          editBotId={editBotId}
        />
      )}
    </div>
  );
}

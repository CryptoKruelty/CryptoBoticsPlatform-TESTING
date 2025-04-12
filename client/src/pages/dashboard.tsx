import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import BotList from "@/components/bots/BotList";
import SubscriptionBanner from "@/components/bots/SubscriptionBanner";
import UsageStats from "@/components/bots/UsageStats";
import CreateBotModal from "@/components/bots/CreateBotModal";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: userData } = useQuery({
    queryKey: ['/api/user/profile'],
  });
  
  return (
    <DashboardLayout>
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
            <p className="text-discord-secondary">Manage your DeFi metric bots</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button 
              className="inline-flex items-center px-4 py-2 bg-discord-primary text-white rounded-md hover:bg-opacity-90 focus:outline-none"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="material-icons mr-2">add</span>
              Create New Bot
            </button>
          </div>
        </div>
      </div>
      
      {/* Subscription Banner */}
      <SubscriptionBanner />
      
      {/* Bot List */}
      <BotList />
      
      {/* Usage Stats */}
      <UsageStats />
      
      {/* Create Bot Modal */}
      {showCreateModal && (
        <CreateBotModal 
          onClose={() => setShowCreateModal(false)} 
          editBotId={null}
        />
      )}
    </DashboardLayout>
  );
}

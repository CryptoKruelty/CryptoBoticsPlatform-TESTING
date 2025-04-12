interface BotStatusFilterProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export default function BotStatusFilter({ currentStatus, onStatusChange }: BotStatusFilterProps) {
  const statuses = [
    { id: 'all', label: 'All Bots' },
    { id: 'active', label: 'Active' },
    { id: 'paused', label: 'Paused' },
    { id: 'configured', label: 'Configured' },
  ];
  
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status.id}
          className={`px-4 py-2 ${currentStatus === status.id ? 'bg-discord-primary' : 'bg-discord-light hover:bg-opacity-80'} text-white rounded-md focus:outline-none`}
          onClick={() => onStatusChange(status.id)}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}

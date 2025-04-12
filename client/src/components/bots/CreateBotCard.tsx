interface CreateBotCardProps {
  onClick: () => void;
}

export default function CreateBotCard({ onClick }: CreateBotCardProps) {
  return (
    <div 
      className="bg-discord-lighter rounded-lg shadow-lg overflow-hidden border-2 border-dashed border-discord-light flex flex-col items-center justify-center p-8 cursor-pointer hover:border-discord-primary transition-colors duration-200"
      onClick={onClick}
    >
      <span className="material-icons text-5xl text-discord-light mb-4">add_circle_outline</span>
      <h3 className="font-heading font-medium text-lg text-center">Create a New Bot</h3>
      <p className="text-sm text-discord-secondary text-center mt-1 mb-4">Track prices, alerts, or custom metrics</p>
      <button 
        className="px-4 py-2 bg-discord-primary text-white rounded-md hover:bg-opacity-90 focus:outline-none"
        onClick={onClick}
      >
        Get Started
      </button>
    </div>
  );
}

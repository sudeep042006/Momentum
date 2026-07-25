import { Calendar } from 'lucide-react';

export default function Header({ showGreeting = false }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = "Sudeep";
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="flex justify-between items-end pb-8">
      <div>
        {showGreeting && (
          <>
            <h1 className="text-3xl font-bold text-white mb-2">{getGreeting()}, {userName}.</h1>
            <p className="text-momentum-text-secondary font-mono text-sm">Discipline today. Freedom tomorrow.</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 bg-momentum-panel border border-momentum-border px-4 py-2 rounded-lg text-momentum-text-secondary hover:text-white transition-colors text-sm">
          <Calendar size={16} />
          {currentDate}
        </button>
      </div>
    </header>
  );
}

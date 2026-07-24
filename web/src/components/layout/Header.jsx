import { Calendar, Sun } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex justify-between items-end pb-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Good evening, Sudeep.</h1>
        <p className="text-momentum-text-secondary font-mono text-sm">Discipline today. Freedom tomorrow.</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 bg-momentum-panel border border-momentum-border px-4 py-2 rounded-lg text-momentum-text-secondary hover:text-white transition-colors text-sm">
          <Calendar size={16} />
          May 24, 2025
        </button>
        <button className="p-2 rounded-lg text-momentum-text-secondary hover:text-white transition-colors">
          <Sun size={20} />
        </button>
      </div>
    </header>
  );
}

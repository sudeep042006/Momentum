import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-momentum-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div className="flex justify-center items-center gap-3 text-momentum-green-bright mb-8">
          <Activity size={48} />
          <h1 className="text-5xl font-bold tracking-tight text-white">MOMENTUM</h1>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-semibold text-momentum-text-primary">
          Discipline today. Freedom tomorrow.
        </h2>
        <p className="text-xl text-momentum-text-secondary max-w-2xl mx-auto">
          Track your daily tasks, maintain your streaks, and visually measure your progress with powerful insights.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 pt-8">
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-8 py-4 bg-momentum-green-bright hover:bg-momentum-green-glow text-momentum-bg font-bold rounded-lg transition-colors text-lg"
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            className="w-full sm:w-auto px-8 py-4 bg-momentum-panel border border-momentum-border hover:border-momentum-green-bright text-momentum-text-primary font-medium rounded-lg transition-colors text-lg"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

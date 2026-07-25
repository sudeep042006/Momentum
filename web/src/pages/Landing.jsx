import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Play, Calendar, CheckSquare, Grid, BarChart2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen bg-momentum-bg font-sans overflow-x-hidden selection:bg-momentum-green selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-momentum-bg/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-momentum-green-bright">
            <Activity size={28} />
            <span className="text-xl font-bold tracking-widest text-white">MOMENTUM</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-momentum-text-secondary">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#screenshots" className="hover:text-white transition-colors">Screenshots</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-white hover:text-momentum-green transition-colors hidden sm:block">
              Log in
            </Link>
            <Link to="/register" className="bg-momentum-green hover:bg-momentum-green-glow text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 lg:pt-40 pb-20 px-6 relative max-w-[1400px] mx-auto">
        {/* Background glow */}
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-momentum-green/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          
          {/* Left Content */}
          <div className="flex-1 text-left w-full relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-momentum-panel border border-momentum-border mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-momentum-green animate-pulse" />
              <span className="text-xs font-medium text-momentum-text-secondary">Discipline today. Freedom tomorrow.</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight"
            >
              Build <span className="text-momentum-green">Momentum.</span><br />
              One <span className="text-momentum-green">Day</span> at a Time.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg lg:text-xl text-momentum-text-secondary mb-10 max-w-xl leading-relaxed"
            >
              Momentum is a personal productivity and consistency tracker that helps you plan your day, execute with focus, and visualize your progress over time.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-16"
            >
              <Link 
                to="/register" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-momentum-green hover:bg-momentum-green-glow text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                Start Building Momentum <ArrowRight size={20} />
              </Link>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:border-white/40 text-white font-medium text-lg px-8 py-4 rounded-xl transition-all">
                See How It Works <Play size={20} className="fill-white/80" />
              </button>
            </motion.div>

            {/* Stats Row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/10"
            >
              <div>
                <div className="text-momentum-green mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                </div>
                <div className="text-2xl font-bold text-white mb-1">27</div>
                <div className="text-sm font-medium text-momentum-text-secondary">Day Streak</div>
              </div>
              <div>
                <div className="text-momentum-green mb-2">
                  <CheckSquare size={24} />
                </div>
                <div className="text-2xl font-bold text-white mb-1">82%</div>
                <div className="text-sm font-medium text-momentum-text-secondary">Avg. Completion</div>
              </div>
              <div>
                <div className="text-momentum-green mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="text-2xl font-bold text-white mb-1">214h</div>
                <div className="text-sm font-medium text-momentum-text-secondary">Focus Hours</div>
              </div>
              <div>
                <div className="text-momentum-green mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                </div>
                <div className="text-2xl font-bold text-white mb-1">1,284</div>
                <div className="text-sm font-medium text-momentum-text-secondary">Tasks Completed</div>
              </div>
            </motion.div>
          </div>

          {/* Right Image Area (Placeholder) */}
          <div className="flex-1 w-full relative h-[500px] lg:h-[700px] bg-momentum-panel/50 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
            <img 
              src="https://res.cloudinary.com/dwji50nl9/image/upload/v1784990185/ChatGPT_Image_Jul_25_2026_07_32_29_PM_sl65wj.png" 
              alt="Momentum Dashboard Preview" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 bg-momentum-bg relative border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-16">Everything you need to stay consistent</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-momentum-panel border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <Calendar className="text-momentum-green mb-4" size={28} />
              <h3 className="text-white font-bold mb-2">Plan Your Day</h3>
              <p className="text-sm text-momentum-text-secondary leading-relaxed">Create structured plans and break down tasks into actionable steps.</p>
            </div>
            <div className="bg-momentum-panel border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <CheckSquare className="text-momentum-green mb-4" size={28} />
              <h3 className="text-white font-bold mb-2">Execute with Focus</h3>
              <p className="text-sm text-momentum-text-secondary leading-relaxed">Stay in the zone and track your tasks as you complete them through the day.</p>
            </div>
            <div className="bg-momentum-panel border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <Grid className="text-momentum-green mb-4" size={28} />
              <h3 className="text-white font-bold mb-2">Visualize Progress</h3>
              <p className="text-sm text-momentum-text-secondary leading-relaxed">5-month heatmap shows your consistency and daily completion at a glance.</p>
            </div>
            <div className="bg-momentum-panel border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <BarChart2 className="text-momentum-green mb-4" size={28} />
              <h3 className="text-white font-bold mb-2">Deep Analytics</h3>
              <p className="text-sm text-momentum-text-secondary leading-relaxed">Powerful insights into your habits, focus time, streaks, and task performance.</p>
            </div>
            <div className="bg-momentum-panel border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <Lock className="text-momentum-green mb-4" size={28} />
              <h3 className="text-white font-bold mb-2">Private & Secure</h3>
              <p className="text-sm text-momentum-text-secondary leading-relaxed">Your data is yours. We don't share, sell, or distract.</p>
            </div>
          </div>

          <div className="bg-momentum-panel border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Activity className="text-momentum-green" size={40} />
              <div>
                <h3 className="text-white font-bold">Momentum isn't about doing more.</h3>
                <p className="text-momentum-text-secondary text-sm">It's about doing what matters, every single day.</p>
              </div>
            </div>
            <Link to="/register" className="w-full sm:w-auto bg-momentum-green hover:bg-momentum-green-glow text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              Start Your Journey <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

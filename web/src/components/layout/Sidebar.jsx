import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  BarChart3, 
  Settings,
  Activity
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Today', path: '/dashboard/today', icon: CheckSquare },
  { name: 'Calendar', path: '/dashboard/calendar', icon: CalendarDays },
  { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Schedule', path: '/dashboard/schedule', icon: Clock },
  { name: 'Journal', path: '/dashboard/journal', icon: BookOpen },
  { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-momentum-border bg-momentum-bg flex flex-col h-screen overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 text-momentum-green-bright mb-4">
        <Activity size={28} />
        <span className="text-xl font-bold tracking-widest text-white">MOMENTUM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-momentum-panel text-momentum-green-bright border border-momentum-border' 
                  : 'text-momentum-text-secondary hover:text-white hover:bg-momentum-panel/50'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-momentum-green-bright' : 'text-momentum-text-secondary'} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Focus Mode & Profile (Bottom) */}
      <div className="p-4 space-y-4">
        {/* Focus Mode Widget */}
        <div className="bg-momentum-panel border border-momentum-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-momentum-text-secondary">Focus Mode</span>
            <span className="text-momentum-green-bright font-bold">On</span>
          </div>
          <div className="h-8 flex items-end gap-1 opacity-50">
            {/* Fake tiny graph */}
            <div className="w-full h-1 bg-momentum-green-bright rounded-full"></div>
            <div className="w-full h-3 bg-momentum-green-bright rounded-full"></div>
            <div className="w-full h-2 bg-momentum-green-bright rounded-full"></div>
            <div className="w-full h-5 bg-momentum-green-bright rounded-full"></div>
            <div className="w-full h-4 bg-momentum-green-bright rounded-full"></div>
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 px-2 pb-2">
          <div className="w-10 h-10 rounded-full bg-momentum-panel border border-momentum-border flex items-center justify-center text-momentum-text-secondary font-bold">
            S
          </div>
          <div>
            <p className="text-white font-medium text-sm">Sudeep</p>
            <p className="text-momentum-text-secondary text-xs">Developer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

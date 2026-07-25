import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  BarChart3, 
  Activity,
  LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', path: '/dashboard/calendar', icon: CalendarDays },
  { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Schedule', path: '/dashboard/schedule', icon: Clock },
  { name: 'Journal', path: '/dashboard/journal', icon: BookOpen },
  { name: 'Users', path: '/dashboard/users', icon: Activity },
];

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    // We can also reload to clear UserContext
    window.location.href = '/login';
  };

  const userName = user?.user_metadata?.name || 'User';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside className="w-64 border-r border-momentum-border bg-momentum-bg flex flex-col h-screen overflow-y-auto shrink-0 shadow-2xl lg:shadow-none">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 text-momentum-green-bright mb-4">
        <Activity size={28} />
        <span className="text-xl font-bold tracking-widest text-white">MOMENTUM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 pb-6">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => onClose && onClose()}
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
    </aside>
  );
}

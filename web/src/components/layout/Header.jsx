import { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useLocation, Link } from 'react-router-dom';

export default function Header() {
  const { user } = useUser();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.name || user?.user_metadata?.name || 'User';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return `${getGreeting()}, ${userName}.`;
    if (path.includes('/tasks')) return 'Tasks';
    if (path.includes('/schedule')) return 'Schedule';
    if (path.includes('/journal')) return 'Journal';
    if (path.includes('/calendar')) return 'Calendar';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/profile')) return 'Profile';
    if (path.includes('/users')) return 'Users';
    return 'Dashboard';
  };

  const initial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <header className="flex justify-between items-center pb-8 border-b border-momentum-border/50 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">{getPageTitle()}</h1>
        <p className="text-momentum-text-secondary font-mono text-xs uppercase tracking-widest">Discipline equals freedom.</p>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 hover:bg-momentum-panel/50 p-2 rounded-xl transition-colors cursor-pointer"
        >
          <div className="text-right hidden sm:block">
            <p className="text-white font-medium text-sm">{userName}</p>
            <p className="text-momentum-text-secondary text-xs">Developer</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-momentum-panel border border-momentum-border flex items-center justify-center text-momentum-green-bright font-bold overflow-hidden">
            {user?.user_metadata?.profilePic || user?.profilePic ? (
               <img src={user?.user_metadata?.profilePic || user?.profilePic} alt={userName} className="w-full h-full object-cover" />
            ) : (
               initial
            )}
          </div>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-momentum-panel border border-momentum-border rounded-xl shadow-2xl py-2 z-50">
            <Link 
              to="/dashboard/profile" 
              className="flex items-center gap-2 px-4 py-2 text-sm text-momentum-text-secondary hover:text-white hover:bg-momentum-bg transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <UserIcon size={16} />
              My Profile
            </Link>
            <div className="h-px bg-momentum-border my-2"></div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-momentum-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

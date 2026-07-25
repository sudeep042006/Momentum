import { useState, useEffect } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/users/search?q=${searchQuery}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <DashboardLayout>
      <Header />
      <div className="max-w-6xl mx-auto h-full flex flex-col px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Momentum Community</h1>
          <p className="text-momentum-text-secondary">Find friends, get inspired, and track shared progress.</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-momentum-text-secondary" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..." 
            className="w-full bg-momentum-panel border border-momentum-border rounded-xl py-3 pl-12 pr-4 text-white placeholder-momentum-text-secondary focus:outline-none focus:border-momentum-green-bright transition-colors"
          />
        </div>

        {searchQuery.trim() === '' ? (
          <div className="text-center text-momentum-text-secondary py-16 flex flex-col items-center gap-4">
            <Search size={48} className="text-momentum-border" />
            <p className="text-lg">Type a name above to find community members</p>
          </div>
        ) : isLoading ? (
          <div className="text-center text-momentum-text-secondary py-12 animate-pulse">Searching...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map(u => (
              <Link 
                to={`/u/${u.name.toLowerCase().replace(/\\s+/g, '')}`} 
                key={u._id}
                className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 hover:border-momentum-green-bright hover:shadow-lg transition-all group flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-momentum-bg border-2 border-momentum-border group-hover:border-momentum-green-bright transition-colors flex items-center justify-center text-2xl font-bold text-momentum-green-bright mb-4 overflow-hidden">
                  {u.profilePic ? (
                    <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    u.name.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="text-white font-semibold text-lg">{u.name}</h3>
                <p className="text-momentum-text-secondary text-sm mb-4">Joined {new Date(u.createdAt).getFullYear()}</p>
                
                <div className="w-full bg-momentum-bg/50 rounded-lg py-2 text-momentum-green-bright text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View Profile &rarr;
                </div>
              </Link>
            ))}
            {users.length === 0 && searchQuery !== '' && (
              <div className="col-span-full text-center text-momentum-text-secondary py-12">
                No users found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

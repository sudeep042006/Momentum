import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/auth.api';
import apiClient from '../services/apiClient';
import { useUser } from '../context/UserContext';
import { Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: loginContext } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login(email, password);
      const token = response.data.data.session.access_token;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', response.data.data.session.refresh_token);
      
      // Fetch full profile immediately to avoid reload delays
      try {
        const meRes = await apiClient.get('/api/users/me');
        loginContext(meRes.data.data, token);
      } catch (err) {
        console.error("Failed to fetch full profile during login", err);
        // Fallback to supabase user if profile fetch fails
        loginContext(response.data.data.user, token);
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-momentum-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 text-momentum-green-bright mb-6">
          <Activity size={32} />
          <h2 className="text-3xl font-bold tracking-tight text-white">MOMENTUM</h2>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-momentum-text-primary">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-momentum-panel py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-momentum-border">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-momentum-text-secondary">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-momentum-border bg-momentum-bg px-3 py-2 text-momentum-text-primary placeholder-momentum-text-secondary focus:border-momentum-green-bright focus:outline-none focus:ring-1 focus:ring-momentum-green-bright sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-momentum-text-secondary">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-momentum-border bg-momentum-bg px-3 py-2 text-momentum-text-primary placeholder-momentum-text-secondary focus:border-momentum-green-bright focus:outline-none focus:ring-1 focus:ring-momentum-green-bright sm:text-sm"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-momentum-green-bright hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-momentum-green-bright py-2 px-4 text-sm font-medium text-momentum-bg shadow-sm hover:bg-momentum-green-glow focus:outline-none focus:ring-2 focus:ring-momentum-green-bright focus:ring-offset-2 focus:ring-offset-momentum-bg disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-momentum-bg/30 border-t-momentum-bg rounded-full animate-spin"></div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-momentum-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-momentum-green-bright hover:text-momentum-green-glow">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

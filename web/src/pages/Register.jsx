import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/auth.api';
import { Activity } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await register({ name, email, password });
      localStorage.setItem('token', response.data.data.session.access_token);
      localStorage.setItem('refresh_token', response.data.data.session.refresh_token);
      localStorage.setItem('userName', response.data.data.user?.user_metadata?.name || name || 'User');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          Start your journey
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-momentum-panel py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-momentum-border">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-momentum-text-secondary">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-momentum-border bg-momentum-bg px-3 py-2 text-momentum-text-primary placeholder-momentum-text-secondary focus:border-momentum-green-bright focus:outline-none focus:ring-1 focus:ring-momentum-green-bright sm:text-sm"
                />
              </div>
            </div>

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
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-momentum-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-momentum-green-bright hover:text-momentum-green-glow">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

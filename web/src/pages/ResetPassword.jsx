import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../services/auth.api';
import { Activity } from 'lucide-react';
import apiClient from '../services/apiClient'; // Used to set token directly if needed

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Supabase redirects here with access_token in the URL hash fragment
    const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      // Store it temporarily so our API client can use it for the reset request
      localStorage.setItem('token', accessToken);
    } else if (!localStorage.getItem('token')) {
      // If no token in URL and no token in storage, redirect to login
      navigate('/login');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await resetPassword(password);
      // Remove token so they have to log in normally
      localStorage.removeItem('token');
      navigate('/login', { state: { message: "Password updated successfully! Please log in." } });
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
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
          Set new password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-momentum-panel py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-momentum-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-momentum-text-secondary">
                New Password
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-momentum-text-secondary">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  'Reset password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

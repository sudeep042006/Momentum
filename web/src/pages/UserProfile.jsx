import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flame, ArrowLeft, MapPin, Calendar, Award, Share, CheckCircle, Activity, UserPlus, UserCheck, Target, Check } from 'lucide-react';
import Heatmap from '../components/dashboard/Heatmap';
import { useUser } from '../context/UserContext';

export default function UserProfile() {
  const { username } = useParams();
  const { user: currentUser } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isCopied, setIsCopied] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/users/public/${encodeURIComponent(username)}`);
      const data = await response.json();
      if (data.success) {
        setProfileData(data.data);
        if (currentUser && data.data.profile.followers.includes(currentUser.id)) {
           setIsFollowing(true);
        } else {
           setIsFollowing(false);
        }
      } else {
        setError(data.message || 'User not found');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username, currentUser]);

  const handleToggleFollow = async () => {
    if (!currentUser || isTogglingFollow) return;
    setIsTogglingFollow(true);
    
    try {
      const token = localStorage.getItem('token');
      const action = isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/users/${encodeURIComponent(username)}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchProfile();
      }
    } catch (err) {
      console.error('Failed to toggle follow', err);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/u/${username}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-momentum-bg flex items-center justify-center text-momentum-text-secondary">
        <div className="animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-momentum-bg flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <p className="text-momentum-text-secondary mb-8">{error || 'Profile not found.'}</p>
        <Link to="/dashboard" className="px-6 py-3 bg-momentum-panel rounded-xl text-white font-medium hover:bg-momentum-border transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const { profile, stats, journals, badges } = profileData;
  const isOwnProfile = currentUser && currentUser.id === profile.user;
  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-momentum-bg text-white p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto h-full flex flex-col pb-12">
        
        {/* Navigation & Header Area */}
        <div className="flex items-center gap-4 py-4 mb-2">
          <Link to="/dashboard" className="p-2 bg-momentum-panel rounded-full hover:bg-momentum-border transition-colors text-momentum-text-secondary hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm font-mono text-momentum-text-secondary tracking-widest uppercase">Public Profile</span>
        </div>

        {/* Top Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 mt-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-momentum-border bg-momentum-bg overflow-hidden flex items-center justify-center text-4xl font-bold text-momentum-green-bright shrink-0">
              {profile.profilePic ? (
                <img src={profile.profilePic} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
              <p className="text-momentum-text-secondary mb-3">{profile.tagline || 'Builder • Learner • Thinker'}</p>
              <div className="flex items-center gap-4 text-xs text-momentum-text-secondary font-mono uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <MapPin size={14} /> Earth
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} /> Joined {joinDate}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-momentum-panel border border-momentum-border rounded-xl p-4 min-w-[120px]">
              <p className="text-xs text-momentum-text-secondary uppercase font-bold tracking-wider mb-1">Followers</p>
              <div className="text-2xl font-bold text-momentum-green-bright">{profile.followers?.length || 0}</div>
            </div>
            <div className="bg-momentum-panel border border-momentum-border rounded-xl p-4 min-w-[120px]">
              <p className="text-xs text-momentum-text-secondary uppercase font-bold tracking-wider mb-1">Following</p>
              <div className="text-2xl font-bold text-white">{profile.following?.length || 0}</div>
            </div>
            {currentUser && !isOwnProfile && (
              <button 
                onClick={handleToggleFollow}
                disabled={isTogglingFollow}
                className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all self-center h-fit ${
                  isFollowing 
                    ? 'bg-momentum-bg border border-momentum-border text-white hover:border-red-500 hover:text-red-500' 
                    : 'bg-momentum-green-bright text-black hover:bg-momentum-green-glow shadow-lg shadow-momentum-green-bright/20'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={18} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-momentum-border mb-8">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-momentum-green-bright border-b-2 border-momentum-green-bright' : 'text-momentum-text-secondary hover:text-white'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'activity' ? 'text-momentum-green-bright border-b-2 border-momentum-green-bright' : 'text-momentum-text-secondary hover:text-white'}`}
            >
              Activity
            </button>
          </div>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-sm text-momentum-text-secondary hover:text-white transition-colors pb-3"
          >
            {isCopied ? <Check size={16} className="text-momentum-green-bright" /> : <Share size={16} />}
            {isCopied ? 'Copied!' : 'Share Profile'}
          </button>
        </div>

        {/* Content Section */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Heatmap */}
              <div className="lg:col-span-2 bg-momentum-panel border border-momentum-border rounded-2xl">
                {profileData.heatmap && (
                   <Heatmap heatmapData={profileData.heatmap} />
                )}
              </div>

              {/* Streak */}
              <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Flame className="text-orange-500" size={18} />
                    Streak
                  </h3>
                  <div className="text-4xl font-bold text-white mb-1">{stats?.currentStreak || 0} <span className="text-lg text-momentum-text-secondary font-normal">days</span></div>
                  <p className="text-sm text-momentum-text-secondary">Current Streak</p>
                </div>
                <div className="mt-8 bg-momentum-green-bright/10 text-momentum-green-bright px-3 py-1 rounded-full text-xs font-bold w-fit">
                  {stats?.currentStreak > 0 ? 'Amazing! 🔥' : 'Start building!'}
                </div>
              </div>

              {/* Badges */}
              <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Award className="text-yellow-500" size={18} />
                  Badges
                </h3>
                <div className="text-2xl font-bold text-white mb-6">{badges?.length || 0} <span className="text-sm text-momentum-text-secondary font-normal">Total Badges</span></div>
                
                <div className="grid grid-cols-3 gap-3">
                  {badges?.slice(0, 6).map(b => (
                    <div key={b._id} className="aspect-square bg-momentum-bg rounded-xl border border-momentum-border flex items-center justify-center text-2xl" title={b.name}>
                      {b.icon || '🏆'}
                    </div>
                  ))}
                  {(!badges || badges.length === 0) && (
                     <div className="col-span-3 text-center text-sm text-momentum-text-secondary py-4 bg-momentum-bg rounded-xl border border-dashed border-momentum-border">
                       No badges yet.
                     </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consistency & Additional Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-5 flex flex-col justify-center">
                 <div className="flex items-center gap-2 text-momentum-text-secondary mb-2">
                   <Target size={18} className="text-blue-400" />
                   <span className="text-sm font-medium">Consistency</span>
                 </div>
                 <div className="text-2xl font-bold text-white">{stats?.avgCompletion || 0}%</div>
                 <p className="text-xs text-momentum-text-secondary mt-1">Average task completion</p>
              </div>
              <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-5 flex flex-col justify-center">
                 <div className="flex items-center gap-2 text-momentum-text-secondary mb-2">
                   <CheckCircle size={18} className="text-momentum-green-bright" />
                   <span className="text-sm font-medium">Tasks Solved</span>
                 </div>
                 <div className="text-2xl font-bold text-white">{stats?.tasksFinished || 0}</div>
                 <p className="text-xs text-momentum-text-secondary mt-1">Total completed tasks</p>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6">
               <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
               <div className="space-y-4">
                 {journals && journals.length > 0 ? (
                   journals.slice(0, 5).map(j => (
                     <div key={j._id} className="flex items-start gap-4 pb-4 border-b border-momentum-border/50 last:border-0 last:pb-0">
                       <div className="mt-1 w-2 h-2 rounded-full bg-momentum-green-bright"></div>
                       <div>
                         <p className="text-white text-sm mb-1">
                           Published a public journal: <span className="font-semibold">{j.title || 'Untitled'}</span>
                         </p>
                         <p className="text-xs text-momentum-text-secondary font-mono">
                           {new Date(j.createdAt).toLocaleDateString()}
                         </p>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-momentum-text-secondary text-sm">No recent activity.</div>
                 )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">All Public Activity</h3>
            <div className="space-y-6">
              {journals && journals.length > 0 ? (
                journals.map(j => (
                  <div key={j._id} className="bg-momentum-bg p-4 rounded-xl border border-momentum-border">
                    <h4 className="font-bold text-white mb-2">{j.title || 'Untitled'}</h4>
                    <p className="text-momentum-text-secondary text-sm italic mb-4">"{j.content}"</p>
                    <p className="text-xs text-momentum-text-secondary font-mono">{new Date(j.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <div className="text-momentum-text-secondary">No public activity found.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

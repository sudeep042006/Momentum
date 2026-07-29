import { useState, useEffect, useRef } from 'react';
import { Camera, Save, Copy, Check, Flame, MapPin, Calendar, Award, Share, X, CheckCircle, Activity, User, Target } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Heatmap from '../components/dashboard/Heatmap';
import { useUser } from '../context/UserContext';
import apiClient from '../services/apiClient';

export default function Profile() {
  const { user, login } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [journals, setJournals] = useState([]);
  const [badges, setBadges] = useState([]);
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tagline, setTagline] = useState('Builder • Learner • Thinker');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const fileInputRef = useRef(null);
  const currentName = user?.user_metadata?.name || user?.name || '';
  const currentEmail = user?.email || '';
  
  // Clean URL without spaces
  const cleanName = currentName.toLowerCase().replace(/\\s+/g, '');
  const shareableUrl = `${window.location.origin}/u/${cleanName}`;

  useEffect(() => {
    if (user) {
      setName(currentName);
      setEmail(currentEmail);
      setPreviewUrl(user.profilePic || user.user_metadata?.profilePic || '');
      fetchProfileData(currentName);
    }
  }, [user]);

  const fetchProfileData = async (nameToFetch) => {
    if (!nameToFetch) return;
    try {
      const fetchName = nameToFetch.toLowerCase().replace(/\\s+/g, '');
      const res = await apiClient.get(`/api/users/public/${fetchName}`);
      const data = res.data;
      if (data.success) {
        setProfileData(data.data.profile);
        if (data.data.profile.tagline) {
          setTagline(data.data.profile.tagline);
        }
        setStats(data.data.stats);
        setJournals(data.data.journals || []);
        setBadges(data.data.badges || []);
      } else if (data.message === 'User not found' && user) {
        // Auto-create MongoDB profile if it doesn't exist yet
        const formData = new FormData();
        formData.append('name', nameToFetch);
        formData.append('email', user.email);
        
        await apiClient.post(`/api/users/profile`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Retry fetch after creation
        const retryRes = await apiClient.get(`/api/users/public/${fetchName}`);
        const retryData = retryRes.data;
        if (retryData.success) {
          setProfileData(retryData.data.profile);
          if (retryData.data.profile.tagline) {
            setTagline(retryData.data.profile.tagline);
          }
          setStats(retryData.data.stats);
          setJournals(retryData.data.journals || []);
          setBadges(retryData.data.badges || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('tagline', tagline);
      if (selectedFile) {
        formData.append('profilePic', selectedFile);
      }

      const token = localStorage.getItem('token');
      const response = await apiClient.post(`/api/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.data) {
        const updatedUser = { ...user, ...response.data.data, user_metadata: { ...user.user_metadata, name: name, profilePic: response.data.data.profilePic } };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        login(updatedUser, token);
        setIsEditing(false);
        fetchProfileData(name);
      }
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const joinDate = profileData ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Loading...';

  return (
    <DashboardLayout>
      <Header />
      <div className="max-w-6xl mx-auto h-full flex flex-col px-6 pb-12 overflow-y-auto">
        
        {/* Top Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 mt-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-momentum-border bg-momentum-bg overflow-hidden flex items-center justify-center text-4xl font-bold text-momentum-green-bright shrink-0 relative group">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentName ? currentName.charAt(0).toUpperCase() : '?'
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{currentName}</h1>
              <p className="text-momentum-text-secondary mb-3">{profileData?.tagline || 'Builder • Learner • Thinker'}</p>
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
              <div className="text-2xl font-bold text-momentum-green-bright">{profileData?.followers?.length || 0}</div>
            </div>
            <div className="bg-momentum-panel border border-momentum-border rounded-xl p-4 min-w-[120px]">
              <p className="text-xs text-momentum-text-secondary uppercase font-bold tracking-wider mb-1">Following</p>
              <div className="text-2xl font-bold text-white">{profileData?.following?.length || 0}</div>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-momentum-bg border border-momentum-border text-white px-4 py-2 rounded-xl hover:bg-momentum-panel transition-colors h-fit self-center flex items-center gap-2 font-medium"
            >
              Edit Profile
            </button>
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
                <Heatmap heatmapData={profileData?.heatmap} />
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
                <div className="text-2xl font-bold text-white mb-6">{badges.length} <span className="text-sm text-momentum-text-secondary font-normal">Total Badges</span></div>
                
                <div className="grid grid-cols-3 gap-3">
                  {badges.slice(0, 6).map(b => (
                    <div key={b._id} className="aspect-square bg-momentum-bg rounded-xl border border-momentum-border flex items-center justify-center text-2xl" title={b.name}>
                      {b.icon || '🏆'}
                    </div>
                  ))}
                  {badges.length === 0 && (
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

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-momentum-panel border border-momentum-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-momentum-text-secondary hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="flex justify-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full border-2 border-momentum-border bg-momentum-bg overflow-hidden flex items-center justify-center text-3xl font-bold text-momentum-green-bright">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentName ? currentName.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={20} />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-wider mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-momentum-bg border border-momentum-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-momentum-green-bright"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-wider mb-2">3 Words (Tagline)</label>
                <input 
                  type="text" 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Builder • Learner • Thinker"
                  className="w-full bg-momentum-bg border border-momentum-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-momentum-green-bright"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-momentum-text-secondary uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-momentum-bg border border-momentum-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-momentum-green-bright"
                />
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-momentum-green-bright text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-momentum-green-glow transition-all disabled:opacity-50 w-full justify-center"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

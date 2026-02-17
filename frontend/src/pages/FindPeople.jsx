import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Search, UserPlus, UserCheck, Users, Loader2 } from 'lucide-react';

const API_BASE = "https://connectly-socialmedia.onrender.com/api";

const FindPeople = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingIds, setProcessingIds] = useState(new Set()); // Track which buttons are loading

  // ==============================
  // 1. Fetch Users
  // ==============================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`${API_BASE}/users/find-people/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
        toast.error("Could not load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ==============================
  // 2. Handle Follow Toggle
  // ==============================
  const handleFollow = async (user) => {
    // Prevent double clicks
    if (processingIds.has(user.id)) return;

    // 1. Add to processing state
    setProcessingIds(prev => new Set(prev).add(user.id));

    // 2. Optimistic Update (Update UI immediately)
    const previousState = [...users];
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, is_following: !u.is_following } : u
    ));

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_BASE}/posts/follow/${user.id}/`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Optional: Toast for success
      // toast.success(user.is_following ? `Unfollowed ${user.full_name}` : `Following ${user.full_name}`);

    } catch (err) {
      console.error("Follow failed", err);
      toast.error("Action failed. Please try again.");
      
      // 3. Rollback UI on error
      setUsers(previousState);
    } finally {
      // 4. Remove from processing state
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  // ==============================
  // 3. Filter Users
  // ==============================
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Toaster position="top-center" />
      
      <div className="min-h-screen bg-gray-50/50 pt-24 px-4 pb-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                <Users className="text-blue-600" /> Find People
              </h1>
              <p className="text-gray-500 mt-1">Discover and connect with new friends.</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search by name..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Grid Content */}
          {loading ? (
             // SKELETON LOADER
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center animate-pulse">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-6" />
                  <div className="h-10 bg-gray-200 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
             // EMPTY STATE
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-400 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No users found</h3>
              <p className="text-gray-500">Try adjusting your search terms.</p>
            </div>
          ) : (
            // USER GRID
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                  
                  {/* Avatar */}
                  <Link to={`/profile/${user.id}`} className="mb-4 relative">
                    <div className="p-1 rounded-full border-2 border-transparent group-hover:border-blue-500 transition-colors">
                      {user.profile_pic ? (
                        <img 
                          src={user.profile_pic} 
                          alt={user.full_name} 
                          className="w-24 h-24 rounded-full object-cover shadow-sm bg-gray-50" 
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-3xl shadow-inner">
                          {user.full_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="mb-6 w-full">
                    <Link to={`/profile/${user.id}`}>
                      <h3 className="font-bold text-gray-900 text-lg mb-1 truncate hover:text-blue-600 transition-colors">
                        {user.full_name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 truncate px-4">
                      @{user.email.split('@')[0]}
                    </p>
                  </div>

                  {/* Follow Button */}
                  <button 
                    onClick={() => handleFollow(user)}
                    disabled={processingIds.has(user.id)}
                    className={`
                      w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                      ${user.is_following 
                        ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95'
                      }
                    `}
                  >
                    {processingIds.has(user.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : user.is_following ? (
                      <>
                        <UserCheck className="w-4 h-4" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Follow
                      </>
                    )}
                  </button>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FindPeople;
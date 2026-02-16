import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const FindPeople = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://127.0.0.1:8000/api/users/find-people/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 2. Handle Follow Toggle
  const handleFollow = async (userId) => {
    // Optimistic Update (Change UI immediately)
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, is_following: !u.is_following };
      }
      return u;
    }));

    // API Call
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`http://127.0.0.1:8000/api/posts/follow/${userId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Follow failed", err);
      // Revert if API fails? (Optional: fetchUsers() to reset)
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen pt-24 px-4 pb-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Find People to Follow</h1>
        
        {loading ? (
          <p className="text-gray-500 text-center">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition">
                
                {/* Avatar */}
                <Link to={`/profile/${user.id}`} className="mb-4">
                  {user.profile_pic ? (
                    <img src={user.profile_pic} alt={user.full_name} className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
                  ) : (
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">
                      {user.full_name[0].toUpperCase()}
                    </div>
                  )}
                </Link>

                {/* Name */}
                <h3 className="font-bold text-gray-900 text-lg mb-1">{user.full_name}</h3>
                <p className="text-xs text-gray-500 mb-4">@{user.email.split('@')[0]}</p>

                {/* Follow Button */}
                <button 
                  onClick={() => handleFollow(user.id)}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition w-full ${
                    user.is_following 
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                  }`}
                >
                  {user.is_following ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindPeople;
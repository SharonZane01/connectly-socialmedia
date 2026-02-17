import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PostCard from '../components/PostCard'; // Reuse our card!

const CLOUDINARY_CLOUD_NAME = 'dbjbc21bz'; 
const CLOUDINARY_UPLOAD_PRESET = 'cloud123'; 

const Profile = () => {
  const { id } = useParams(); // Get ID from URL (e.g., /profile/5)
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBio, setNewBio] = useState('');
  const [uploading, setUploading] = useState(false);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      if (!token) return navigate('/login');

      // Determine if looking at self or others
      // If no ID in URL, or ID matches logged-in user -> It's ME
      const isMe = !id || (currentUser && String(currentUser.id) === String(id));
      setIsMyProfile(isMe);

      try {
        let endpoint = isMe 
          ? 'https://connectly-socialmedia.onrender.com/api/users/profile/' 
          : `https://connectly-socialmedia.onrender.com/api/users/${id}/`; // You might need to create this endpoint if it doesn't exist, see note below*

        // *Quick Fix for now: Use the 'find-people' list to get data if standard endpoint fails, 
        // OR better: Update backend to allow fetching specific user.
        // For now, let's assume we fetch "My Profile" standardly, but for others we might need a specific view.
        
        // ACTUALLY: Let's use the standard "Get User" logic. 
        // If the backend doesn't have a specific "Get User by ID" view yet, we can filter locally or add it.
        // Let's try the cleanest approach: Re-using the profile view if it's me.
        
        if (isMe) {
            const res = await axios.get('https://connectly-socialmedia.onrender.com/api/users/profile/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileUser(res.data);
            setNewName(res.data.full_name);
            setNewBio(res.data.bio || '');
        } else {
            // Fetch "Other" user. 
            // NOTE: We need to ensure we have an endpoint for this. 
            // If not, we can use the "Find People" endpoint and filter (temporary) or build a DetailView (proper).
            // Let's assume we build the proper view in Step 2.
            const res = await axios.get(`https://connectly-socialmedia.onrender.com/api/users/profile/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileUser(res.data);
            setIsFollowing(res.data.is_following);
        }

        // Fetch Posts
        const postRes = await axios.get('https://connectly-socialmedia.onrender.com/api/posts/', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter posts by this user's name (or ID if available in serializer)
        // Note: Ideally filter by ID. For now filtering by Name as per previous code.
        const userPosts = postRes.data.filter(p => {
            // We need to match the post author to the profile user
            // If we fetched the profile, use its name.
            // If waiting for profile, this might be tricky.
            return true; // We will filter inside the render or after profile loads
        });
        setPosts(postRes.data.filter(p => p.author === (isMe ? currentUser.id : parseInt(id))).reverse());

      } catch (err) {
        console.error("Error loading profile", err);
      }
    };

    fetchData();
  }, [id, navigate]);

  // --- 2. Follow / Unfollow ---
  const handleFollow = async () => {
    // Optimistic
    setIsFollowing(!isFollowing);
    try {
        const token = localStorage.getItem('access_token');
        await axios.post(`https://connectly-socialmedia.onrender.com/api/posts/follow/${id}/`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (err) {
        setIsFollowing(!isFollowing); // Revert
    }
  };

  // --- 3. Edit Profile (Only for ME) ---
  const handleSaveProfile = async () => {
    const token = localStorage.getItem('access_token');
    try {
        const res = await axios.patch('https://connectly-socialmedia.onrender.com/api/users/profile/', 
            { full_name: newName, bio: newBio },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfileUser(res.data);
        setIsEditing(false);
        // Update local storage too so Navbar updates
        localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
        alert("Failed to update");
    }
  };

  // --- 4. Upload Image ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: "POST", body: formData
        });
        const cloudData = await cloudRes.json();
        
        // Send URL to Backend
        const token = localStorage.getItem('access_token');
        const res = await axios.patch('https://connectly-socialmedia.onrender.com/api/users/profile/', 
            { profile_pic: cloudData.secure_url },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfileUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
        console.error(err);
    } finally {
        setUploading(false);
    }
  };

  // --- 5. Logout ---
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!profileUser) return <div className="text-center pt-20">Loading Profile...</div>;

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-gray-900 pb-10">
      
      {/* Navbar Placeholder */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 mb-8">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-2">← Home</Link>
          {isMyProfile && (
             <button onClick={handleLogout} className="text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition">Log Out</button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-8">
        
        {/* === PROFILE CARD === */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center relative overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 absolute top-0 left-0 right-0"></div>
          
          <div className="relative mt-12 mb-6">
            <div className="w-32 h-32 bg-white p-1.5 rounded-full shadow-lg mx-auto relative group">
              {profileUser.profile_pic ? (
                <img src={profileUser.profile_pic} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black text-4xl">
                  {profileUser.full_name[0].toUpperCase()}
                </div>
              )}
              
              {/* Upload Overlay (Only if ME) */}
              {isMyProfile && (
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white font-bold text-xs">
                    {uploading ? "..." : "Change"}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          {isEditing ? (
             <div className="space-y-4">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="block w-full text-center border p-2 rounded" />
                <textarea value={newBio} onChange={e => setNewBio(e.target.value)} className="block w-full border p-2 rounded" placeholder="Bio..." />
                <div className="flex justify-center gap-2">
                    <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                    <button onClick={() => setIsEditing(false)} className="text-gray-500 px-4 py-2">Cancel</button>
                </div>
             </div>
          ) : (
            <>
                <h1 className="text-2xl font-black text-gray-900 flex items-center justify-center gap-2">
                    {profileUser.full_name}
                    {isMyProfile && (
                        <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-blue-500">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                    )}
                </h1>
                <p className="text-gray-500 mb-4">@{profileUser.email.split('@')[0]}</p>
                {profileUser.bio && <p className="text-gray-700 max-w-md mx-auto mb-6">{profileUser.bio}</p>}

                {!isMyProfile && (
                    <button 
                        onClick={handleFollow}
                        className={`px-8 py-2 rounded-full font-bold transition ${isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}`}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                )}
            </>
          )}
        </div>

        {/* === POSTS LIST === */}
        <h2 className="text-xl font-black text-gray-800 px-2">{isMyProfile ? "My Posts" : `${profileUser.full_name}'s Posts`}</h2>
        <div className="grid gap-6">
            {posts.length === 0 ? <p className="text-gray-400 text-center">No posts yet.</p> : (
                posts.map(post => (
                    <PostCard key={post.id} post={post} user={JSON.parse(localStorage.getItem('user'))} />
                ))
            )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
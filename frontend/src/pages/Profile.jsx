import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// --- CLOUDINARY CONFIG ---
const CLOUDINARY_CLOUD_NAME = 'dbjbc21bz'; 
const CLOUDINARY_UPLOAD_PRESET = 'cloud123'; 

const Profile = () => {
  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // --- 1. Load Profile & My Posts ---
  const fetchProfileData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return navigate('/login');

    try {
      // Get User Info
      const userRes = await axios.get('http://127.0.0.1:8000/api/users/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);
      setNewName(userRes.data.full_name);

      // Get All Posts and Filter (Simple approach)
      const postRes = await axios.get('http://127.0.0.1:8000/api/posts/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter for MY posts only
      const myOwnPosts = postRes.data.filter(p => p.user === userRes.data.full_name);
      setMyPosts(myOwnPosts.reverse());

    } catch (err) {
      console.error("Error loading profile", err);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // --- 2. Handle Profile Picture Upload ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      // Upload to Cloudinary
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const cloudData = await cloudRes.json();
      
      // Save URL to Django
      await saveProfileChanges(null, cloudData.secure_url);
      
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // --- 3. Save Changes (Name or Pic) ---
  const saveProfileChanges = async (nameOverride = null, imageOverride = null) => {
    const token = localStorage.getItem('access_token');
    try {
      const payload = {
        full_name: nameOverride || newName,
      };
      if (imageOverride) payload.profile_pic = imageOverride;

      const res = await axios.patch('http://127.0.0.1:8000/api/users/profile/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data)); // Update local storage
      setIsEditing(false);
      alert("Profile updated!");
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  // --- 4. Delete Post ---
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/posts/${postId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from UI
      setMyPosts(myPosts.filter(p => p.id !== postId));
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  // --- 5. Logout ---
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-gray-900 pb-10">
      
      {/* Navbar Placeholder (Back Button) */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 mb-8">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-2">
            ← Back to Home
          </Link>
          <button onClick={handleLogout} className="text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition">
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-8">
        
        {/* === PROFILE CARD === */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center relative overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 absolute top-0 left-0 right-0"></div>
          
          <div className="relative mt-12 mb-6">
            <div className="w-32 h-32 bg-white p-1.5 rounded-full shadow-lg mx-auto relative group">
              {user.profile_pic ? (
                <img src={user.profile_pic} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black text-4xl">
                  {user.full_name[0].toUpperCase()}
                </div>
              )}
              
              {/* Upload Overlay */}
              <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white font-bold text-xs">
                {uploading ? "..." : "Change"}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          {isEditing ? (
            <div className="flex justify-center gap-2 mb-4">
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
              />
              <button onClick={() => saveProfileChanges()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Save</button>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 px-4 py-2">Cancel</button>
            </div>
          ) : (
            <div className="mb-6">
              <h1 className="text-2xl font-black text-gray-900 flex items-center justify-center gap-2">
                {user.full_name}
                <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-blue-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </h1>
              <p className="text-gray-500">@{user.email}</p>
            </div>
          )}
        </div>

        {/* === MY POSTS === */}
        <h2 className="text-xl font-black text-gray-800 px-2">My Posts</h2>
        
        {myPosts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-gray-200 border-dashed">
            <p className="text-gray-400">You haven't posted anything yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {myPosts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-4">
                {post.image && (
                  <img src={post.image} alt="Thumbnail" className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
                )}
                <div className="flex-grow">
                  <p className="font-medium text-gray-900 line-clamp-2">{post.caption || "No caption"}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                
                {/* Delete Button */}
                <button 
                  onClick={() => handleDeletePost(post.id)}
                  className="p-3 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition"
                  title="Delete Post"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
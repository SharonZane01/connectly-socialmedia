import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import CreatePostModal from '../components/CreatePostModal';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // --- Fetch Posts ---
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get('http://127.0.0.1:8000/api/posts/', config);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts", err);
    }
  };

  // --- Handle Like ---
  const handleLike = async (postId) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    
    const post = posts[postIndex];
    const newIsLiked = !post.is_liked;
    const newLikesCount = newIsLiked ? post.likes + 1 : post.likes - 1;

    const updatedPosts = [...posts];
    updatedPosts[postIndex] = { ...post, likes: newLikesCount, is_liked: newIsLiked };
    setPosts(updatedPosts);

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/like/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      fetchPosts(); 
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) setUser(JSON.parse(storedUser));
    fetchPosts();
  }, []);

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-gray-900">
      
      {/* === NEW: TOP NAVBAR (Visible on ALL screens) === */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl">
              C
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">Connectly.</span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-70 transition">
                <span className="hidden md:block font-bold text-sm text-gray-700">{user.full_name}</span>
                {user.profile_pic ? (
                  <img src={user.profile_pic} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {user.full_name[0].toUpperCase()}
                  </div>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="font-bold text-sm text-gray-600 hover:text-blue-600">Log In</Link>
                <Link to="/signup" className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* === MAIN LAYOUT === */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 pt-24 pb-10">
        
        {/* === LEFT SIDEBAR (Hidden on Mobile) === */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="px-6 pb-6">
              <div className="relative -mt-12 mb-4">
                <Link to={user ? "/profile" : "/login"} className="block w-24 h-24 mx-auto group">
                  <div className="w-full h-full bg-white p-1.5 rounded-2xl shadow-md transition-transform group-hover:scale-105">
                    {user && user.profile_pic ? (
                      <img src={user.profile_pic} alt="Profile" className="w-full h-full rounded-xl object-cover shadow-sm border border-gray-100" />
                    ) : (
                      <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-3xl shadow-inner">
                        {user ? user.full_name[0].toUpperCase() : 'G'}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
              
              {user ? (
                <>
                  <div className="text-center mb-6">
                    <Link to="/profile" className="block hover:underline decoration-blue-500 decoration-2 underline-offset-4">
                      <h2 className="font-bold text-lg text-gray-900">{user.full_name}</h2>
                    </Link>
                    <p className="text-gray-500 text-sm">@{user.email.split('@')[0]}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                    <div className="text-center"><p className="text-xs text-gray-400 font-bold uppercase">Posts</p><p className="font-black text-lg text-gray-800">{posts.filter(p => p.user === user.full_name).length}</p></div>
                    <div className="text-center border-l border-gray-100"><p className="text-xs text-gray-400 font-bold uppercase">Followers</p><p className="font-black text-lg text-gray-800">842</p></div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="font-bold text-lg text-gray-900 mb-2">Welcome Guest!</h2>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed px-2">Join the community today.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === CENTER FEED (Visible Everywhere) === */}
        <div className="col-span-1 lg:col-span-6 space-y-6">
          
          {/* Create Post Input */}
          {user ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
              <Link to="/profile" className="flex-shrink-0">
                <div className="w-10 h-10">
                  {user.profile_pic ? (
                    <img src={user.profile_pic} alt="Me" className="w-full h-full rounded-full object-cover shadow-sm border border-gray-100" />
                  ) : (
                    <div className="w-full h-full bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                      {user.full_name[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              <button onClick={() => setIsModalOpen(true)} className="bg-gray-100 text-gray-500 text-left rounded-full flex-grow py-3 px-6 hover:bg-gray-200 transition font-medium">
                Share something interesting, {user.full_name.split(' ')[0]}...
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200 p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div><h3 className="font-bold text-xl mb-1">Have something to share?</h3><p className="text-blue-100 text-sm">Log in to create your first post.</p></div>
              <Link to="/login" className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition shadow-md whitespace-nowrap">Log In</Link>
            </div>
          )}

          {/* Posts Feed */}
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {post.user ? post.user[0].toUpperCase() : '?'}
                </div>
                <div><h3 className="font-bold text-gray-900 text-sm">{post.user}</h3><p className="text-xs text-gray-500">Public Post</p></div>
              </div>
              
              {post.image && <div className="w-full bg-gray-100"><img src={post.image} alt="post" className="w-full object-cover max-h-[500px]" /></div>}

              <div className="p-4">
                <div className="flex items-center space-x-6 mb-3">
                  <button onClick={() => user && handleLike(post.id)} className={`flex items-center space-x-2 transition group ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}>
                     <div className={`p-2 rounded-full transition ${post.is_liked ? 'bg-red-50' : 'group-hover:bg-gray-100'}`}>
                      <svg className={`w-6 h-6 transition-colors ${post.is_liked ? 'text-red-500 fill-current' : 'text-gray-400 group-hover:text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                     </div>
                     <span className={`font-medium text-sm ${post.is_liked ? 'text-red-500' : 'text-gray-500 group-hover:text-red-500'}`}>{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition group">
                     <div className="p-2 rounded-full group-hover:bg-blue-50 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>
                     <span className="font-medium text-sm">Comment</span>
                  </button>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed"><span className="font-bold text-gray-900 mr-2">{post.user}</span>{post.caption}</p>
              </div>
            </div>
          ))}
        </div>

        {/* === RIGHT SIDEBAR (Hidden on Mobile) === */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
             <h3 className="font-bold text-gray-900 text-lg mb-4">Trending</h3>
             <div className="space-y-4">
               {['#ConnectlyLaunch', '#DevCommunity', '#ReactJS'].map(tag => (
                 <div key={tag} className="flex flex-col"><span className="font-semibold text-gray-700 text-sm hover:text-blue-600 cursor-pointer transition">{tag}</span><span className="text-xs text-gray-400">2.4k posts</span></div>
               ))}
             </div>
          </div>
        </div>

      </div>

      {user && <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPostCreated={fetchPosts} user={user} />}
    </div>
  );
};

export default Home;
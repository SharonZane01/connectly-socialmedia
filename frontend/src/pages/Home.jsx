import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  TrendingUp, Users, FileText, Heart,
  Sparkles, Search, Plus, ArrowRight,
  MessageSquare, Loader2, LogOut
} from 'lucide-react';

// Assuming you have these components
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';

// ==========================================
// 1. API CONFIGURATION (Ideally move to services/api.js)
// ==========================================
const API_BASE = "https://connectly-socialmedia.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE,
});

// Request Interceptor: Auto-inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = '/login'; // Force redirect
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 2. SUB-COMPONENTS (For cleaner main file)
// ==========================================

const ProfileSkeleton = () => (
  <div className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse">
    <div className="h-28 bg-gray-200" />
    <div className="px-6 pb-6">
      <div className="-mt-14 flex justify-center">
        <div className="w-28 h-28 bg-gray-300 rounded-3xl border-4 border-white" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
      </div>
    </div>
  </div>
);

const PostSkeleton = () => (
  <div className="bg-white rounded-2xl shadow p-4 animate-pulse mb-4">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full" />
      <div className="space-y-2">
        <div className="w-32 h-4 bg-gray-200 rounded" />
        <div className="w-20 h-3 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="h-32 bg-gray-200 rounded mb-4" />
    <div className="h-8 bg-gray-200 rounded w-1/4" />
  </div>
);

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

const Home = () => {
  const navigate = useNavigate();

  // State
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("for-you");
  
  // Loading States
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Safe User Parsing
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  // --- Data Fetching ---

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsUserLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/users/profile/');
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch (err) {
      console.error("Profile fetch error", err);
      // Fallback to stored user if API fails temporarily
      setUser(getStoredUser()); 
    } finally {
      setIsUserLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async (type = activeTab) => {
    try {
      setIsPostsLoading(true);
      const endpoint = type === "following" ? "/posts/?feed=following" : "/posts/";
      const { data } = await api.get(endpoint);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load feed.");
      console.error(err);
    } finally {
      setIsPostsLoading(false);
    }
  }, [activeTab]);

  // --- Effects ---

  useEffect(() => {
    // Initial Hydration
    setUser(getStoredUser());
    fetchUserData();
    fetchPosts();
  }, [fetchUserData, fetchPosts]);

  // --- Computed Values ---

  const userPostCount = useMemo(() => {
    if (!user) return 0;
    return posts.filter(p => p.author_name === user.full_name).length;
  }, [user, posts]);

  const trendingTopics = [
    { tag: "#ConnectlyLaunch", posts: "2.4k", color: "bg-blue-500" },
    { tag: "#DevCommunity", posts: "1.8k", color: "bg-indigo-500" },
    { tag: "#ReactJS", posts: "3.1k", color: "bg-purple-500" },
    { tag: "#Python", posts: "2.9k", color: "bg-pink-500" }
  ];

  // --- Handlers ---

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    // fetchPosts handles the loading state inside itself
  };

  return (
    <>
      <Toaster position="top-center" />
      
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 pt-24 pb-10">

          {/* ========================= */}
          {/* LEFT SIDEBAR (User Profile) */}
          {/* ========================= */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              {isUserLoading && !user ? (
                <ProfileSkeleton />
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Banner */}
                  <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <div className="absolute top-2 right-2">
                       {user && <span className="px-2 py-1 bg-black/20 text-white text-xs rounded-lg backdrop-blur-sm">Pro Member</span>}
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="-mt-14 text-center mb-4 relative z-10">
                      <Link to={user ? "/profile" : "/login"} className="inline-block relative">
                        {user?.profile_pic ? (
                          <img
                            src={user.profile_pic}
                            alt={user.full_name}
                            className="w-28 h-28 rounded-3xl mx-auto object-cover border-4 border-white shadow-md bg-white"
                          />
                        ) : (
                          <div className="w-28 h-28 rounded-3xl mx-auto bg-blue-50 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md text-blue-600">
                            {user?.full_name?.[0]?.toUpperCase() || <Users />}
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Info */}
                    {user ? (
                      <>
                        <div className="text-center mb-6">
                          <h2 className="font-bold text-xl text-gray-900">{user.full_name}</h2>
                          <p className="text-gray-500 text-sm">@{user.email.split("@")[0]}</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center mb-6">
                          <div className="p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                            <span className="block font-bold text-lg text-gray-900">{userPostCount}</span>
                            <span className="text-xs text-gray-500">Posts</span>
                          </div>
                          <div className="p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                            <span className="block font-bold text-lg text-gray-900">{user.following_count || 0}</span>
                            <span className="text-xs text-gray-500">Following</span>
                          </div>
                          <div className="p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                            <span className="block font-bold text-lg text-gray-900">{user.followers_count || 0}</span>
                            <span className="text-xs text-gray-500">Followers</span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-2">
                          <Link 
                            to="/find-people" 
                            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-blue-200 shadow-lg"
                          >
                            <Search size={18} /> Discover
                          </Link>
                          <Link 
                            to="/chat" 
                            className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <MessageSquare size={18} /> Messages
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-4 text-sm">Log in to unlock all features</p>
                        <Link to="/login" className="block w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700">
                          Login Now
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mini Footer */}
              <div className="mt-6 text-center text-xs text-gray-400">
                <p>© 2024 Connectly Inc.</p>
                <div className="flex justify-center gap-2 mt-2">
                  <a href="#" className="hover:underline">Privacy</a>
                  <span>•</span>
                  <a href="#" className="hover:underline">Terms</a>
                </div>
              </div>
            </div>
          </div>

          {/* ========================= */}
          {/* MAIN FEED */}
          {/* ========================= */}
          <div className="col-span-1 lg:col-span-6 space-y-5">
            
            {/* Create Post Input */}
            {user && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 transition-transform hover:scale-[1.01]">
                <div className="flex gap-4">
                  <div className="shrink-0">
                     {user.profile_pic ? (
                        <img src={user.profile_pic} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                     ) : (
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                           {user.full_name[0]}
                        </div>
                     )}
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 bg-gray-50 rounded-2xl px-4 text-left text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-between group"
                  >
                    <span>What's on your mind, {user.full_name.split(' ')[0]}?</span>
                    <Plus className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {/* Feed Tabs */}
            {user && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 flex">
                <button
                  onClick={() => handleTabChange("for-you")}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === "for-you"
                      ? "bg-gray-900 text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  For You
                </button>
                <button
                  onClick={() => handleTabChange("following")}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === "following"
                      ? "bg-gray-900 text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Following
                </button>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
              {isPostsLoading ? (
                // Show 3 skeletons while loading
                [1, 2, 3].map((n) => <PostSkeleton key={n} />)
              ) : posts.length === 0 ? (
                // Empty State
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500 max-w-xs mx-auto mb-6">
                    {activeTab === 'following' 
                      ? "Follow more people to see their updates here!" 
                      : "Be the first to share something amazing with the community."}
                  </p>
                  {user && (
                     <button 
                       onClick={() => setIsModalOpen(true)}
                       className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                     >
                       Create Post
                     </button>
                  )}
                </div>
              ) : (
                // Actual Posts
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                  />
                ))
              )}
            </div>
          </div>

          {/* ========================= */}
          {/* RIGHT SIDEBAR (Trending) */}
          {/* ========================= */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              
              {/* Trending Widget */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="text-orange-600 w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">Trending Now</h3>
                </div>

                <div className="space-y-5">
                  {trendingTopics.map((item) => (
                    <div key={item.tag} className="flex justify-between items-start group cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}></span>
                           <h4 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">{item.tag}</h4>
                        </div>
                        <p className="text-xs text-gray-400 pl-3.5">{item.posts} posts</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-6 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-colors">
                  View all topics
                </button>
              </div>

              {/* Advertisement / Promo Placeholder */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white text-center">
                 <Sparkles className="mx-auto w-8 h-8 mb-3 text-yellow-300" />
                 <h3 className="font-bold mb-1">Connectly Premium</h3>
                 <p className="text-xs text-indigo-100 mb-4">Unlock exclusive badges and analytics.</p>
                 <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-gray-50 transition-colors">
                    Try Free
                 </button>
              </div>

            </div>
          </div>

        </div>

        {/* ========================= */}
        {/* MODAL */}
        {/* ========================= */}
        {user && (
          <CreatePostModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onPostCreated={() => {
              fetchPosts(activeTab);
              toast.success("Post created successfully!");
            }}
            user={user}
          />
        )}
      </div>
    </>
  );
};

export default Home;
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  FileText,
  Heart,
  Sparkles,
  Search,
  Plus,
  ArrowRight
} from 'lucide-react';

import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';


const API_BASE = "https://connectly-socialmedia.onrender.com/api";


const Home = () => {

  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("for-you");
  const [loading, setLoading] = useState(false);


  /*
  ============================================
  GET AUTH HEADER
  ============================================
  */
  const getAuthConfig = () => {
    const token = localStorage.getItem("access_token");

    if (!token) return {};

    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };


  /*
  ============================================
  FETCH POSTS
  FIXES:
  - useCallback prevents infinite rerenders
  - correct activeTab handling
  - loading state
  - error safety
  ============================================
  */
  const fetchPosts = useCallback(async (type = activeTab) => {

    try {

      setLoading(true);

      let url = `${API_BASE}/posts/`;

      if (type === "following") {
        url += "?feed=following";
      }

      const res = await axios.get(url, getAuthConfig());

      setPosts(Array.isArray(res.data) ? res.data : []);

    }
    catch (err) {

      console.error("Fetch posts failed:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
      }

    }
    finally {
      setLoading(false);
    }

  }, [activeTab]);



  /*
  ============================================
  FETCH USER DATA
  FIXES:
  - keeps counts updated
  - handles logout safely
  ============================================
  */
  const fetchUserData = useCallback(async () => {

    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {

      const res = await axios.get(
        `${API_BASE}/users/profile/`,
        getAuthConfig()
      );

      setUser(res.data);

      localStorage.setItem(
        "user",
        JSON.stringify(res.data)
      );

    }
    catch (err) {

      console.error("User refresh failed:", err);

      if (err.response?.status === 401) {

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        setUser(null);

      }

    }

  }, []);




  /*
  ============================================
  INITIAL LOAD
  ============================================
  */
  useEffect(() => {

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchPosts();
    fetchUserData();

  }, [fetchPosts, fetchUserData]);



  /*
  ============================================
  TAB CHANGE HANDLER
  FIX:
  ensures state + fetch sync
  ============================================
  */
  const handleTabChange = (tab) => {

    setActiveTab(tab);

    fetchPosts(tab);

  };



  /*
  ============================================
  USER POST COUNT
  FIX:
  safe optional chaining
  ============================================
  */
  const userPostCount =
    user
      ? posts.filter(
          p => p.author_name === user.full_name
        ).length
      : 0;



  /*
  ============================================
  TRENDING DATA
  FIX:
  tailwind dynamic color bug fixed
  ============================================
  */
  const trending = [
    {
      tag: "#ConnectlyLaunch",
      posts: "2.4k",
      dot: "bg-blue-500"
    },
    {
      tag: "#DevCommunity",
      posts: "1.8k",
      dot: "bg-indigo-500"
    },
    {
      tag: "#ReactJS",
      posts: "3.1k",
      dot: "bg-purple-500"
    },
    {
      tag: "#Python",
      posts: "2.9k",
      dot: "bg-pink-500"
    }
  ];



  return (
    <>

      {/* ========================= */}
      {/* MAIN CONTAINER */}
      {/* ========================= */}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 pt-24 pb-10">


          {/* ========================= */}
          {/* LEFT SIDEBAR */}
          {/* ========================= */}

          <div className="hidden lg:block lg:col-span-3">

            <div className="bg-white rounded-3xl shadow-lg sticky top-24 overflow-hidden">


              {/* HEADER */}
              <div className="h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" />


              <div className="px-6 pb-6">

                {/* PROFILE */}
                <div className="-mt-14 text-center">

                  <Link to={user ? "/profile" : "/login"}>

                    {user?.profile_pic ? (

                      <img
                        src={user.profile_pic}
                        alt=""
                        className="w-28 h-28 rounded-3xl mx-auto object-cover border-4 border-white shadow-lg"
                      />

                    ) : (

                      <div className="w-28 h-28 rounded-3xl mx-auto bg-blue-100 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">

                        {user?.full_name?.[0] || "G"}

                      </div>

                    )}

                  </Link>

                </div>



                {/* USER INFO */}
                {user ? (

                  <>

                    <div className="text-center mt-3">

                      <h2 className="font-bold text-xl">
                        {user.full_name}
                      </h2>

                      <p className="text-gray-500 text-sm">
                        @{user.email.split("@")[0]}
                      </p>

                    </div>



                    {/* STATS */}
                    <div className="grid grid-cols-3 mt-5 text-center">

                      <Link to="/profile">

                        <FileText className="mx-auto w-5 h-5 text-blue-600" />

                        <p className="font-bold">{userPostCount}</p>

                        <p className="text-xs text-gray-500">Posts</p>

                      </Link>


                      <Link to="/profile">

                        <Heart className="mx-auto w-5 h-5 text-pink-600" />

                        <p className="font-bold">
                          {user.following_count || 0}
                        </p>

                        <p className="text-xs text-gray-500">
                          Following
                        </p>

                      </Link>


                      <Link to="/profile">

                        <Users className="mx-auto w-5 h-5 text-indigo-600" />

                        <p className="font-bold">
                          {user.followers_count || 0}
                        </p>

                        <p className="text-xs text-gray-500">
                          Followers
                        </p>

                      </Link>

                    </div>



                    {/* ACTIONS */}

                    <Link
                      to="/find-people"
                      className="block mt-5 text-center bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700"
                    >
                      Discover People
                    </Link>


                    <Link
                      to="/chat"
                      className="block mt-2 text-center bg-gray-100 py-2 rounded-xl hover:bg-gray-200"
                    >
                      Messages
                    </Link>


                  </>

                ) : (

                  <div className="text-center mt-5">

                    <Link
                      to="/login"
                      className="block bg-blue-600 text-white py-2 rounded-xl font-bold"
                    >
                      Login
                    </Link>

                  </div>

                )}

              </div>

            </div>

          </div>



          {/* ========================= */}
          {/* FEED */}
          {/* ========================= */}

          <div className="col-span-1 lg:col-span-6 space-y-4">


            {/* CREATE POST */}
            {user && (

              <div className="bg-white rounded-2xl shadow p-4">

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-gray-100 rounded-xl p-4 text-left hover:bg-gray-200"
                >
                  What's on your mind?
                </button>

              </div>

            )}



            {/* TABS */}
            {user && (

              <div className="bg-white rounded-2xl shadow flex">

                <button
                  onClick={() => handleTabChange("for-you")}
                  className={`flex-1 p-3 font-semibold ${
                    activeTab === "for-you"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  For You
                </button>


                <button
                  onClick={() => handleTabChange("following")}
                  className={`flex-1 p-3 font-semibold ${
                    activeTab === "following"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  Following
                </button>

              </div>

            )}



            {/* POSTS */}

            {loading ? (

              <div className="text-center py-10 text-gray-500">
                Loading...
              </div>

            ) : posts.length === 0 ? (

              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">

                No posts found

              </div>

            ) : (

              posts.map(post => (

                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                />

              ))

            )}


          </div>



          {/* ========================= */}
          {/* RIGHT SIDEBAR */}
          {/* ========================= */}

          <div className="hidden lg:block lg:col-span-3">

            <div className="bg-white rounded-3xl shadow p-5 sticky top-24">

              <div className="flex items-center gap-2 mb-4">

                <TrendingUp className="text-orange-500" />

                <h3 className="font-bold">
                  Trending
                </h3>

              </div>


              {trending.map(item => (

                <div
                  key={item.tag}
                  className="flex justify-between py-3 border-b"
                >

                  <div className="flex gap-2 items-center">

                    <div className={`w-2 h-2 rounded-full ${item.dot}`} />

                    <span>{item.tag}</span>

                  </div>

                  <span className="text-gray-400 text-sm">
                    {item.posts}
                  </span>

                </div>

              ))}

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
            onPostCreated={() => fetchPosts(activeTab)}
            user={user}
          />

        )}


      </div>

    </>
  );
};



export default Home;

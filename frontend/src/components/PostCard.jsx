import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Send, 
  MoreHorizontal,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';

const PostCard = ({ post, user }) => {
  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [isLiking, setIsLiking] = useState(false);
  
  // Comment State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);

  // Video State
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = React.useRef(null);

  // Helper to check if it's a video (checks DB type OR file extension)
  const isVideo = post.media_type === 'video' || (post.media_url && post.media_url.match(/\.(mp4|webm|ogg|mov)$/i));

  // Auto-play video when in viewport (like Instagram)
  React.useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {
              // Auto-play was prevented, user needs to interact first
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 } // Play when 50% visible
    );

    observer.observe(videoRef.current);

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [isVideo]);

  // Toggle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // --- LIKE HANDLER ---
  const handleLike = async () => {
    if (!user) return alert("Please login to like.");
    if (isLiking) return; // Prevent double-click
    
    const originalLiked = isLiked;
    
    // Optimistic Update with animation trigger
    setIsLiking(true);
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`https://connectly-socialmedia.onrender.com/api/posts/${post.id}/like/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Revert if error
      setIsLiked(originalLiked);
      setLikes(post.likes);
    } finally {
      setTimeout(() => setIsLiking(false), 600);
    }
  };

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    if (!user) return alert("Please login to save.");
    
    // Optimistic Update
    setIsSaved(!isSaved);

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`https://connectly-socialmedia.onrender.com/api/posts/${post.id}/save/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      setIsSaved(!isSaved); // Revert
    }
  };

  // --- COMMENT HANDLERS ---
  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      // Fetch comments only when opening
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`https://connectly-socialmedia.onrender.com/api/posts/${post.id}/comments/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setComments(res.data);
      } catch (err) {
        console.error("Failed to load comments");
      }
    }
    setShowComments(!showComments);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`https://connectly-socialmedia.onrender.com/api/posts/${post.id}/comments/`, 
        { content: newComment }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Add new comment to list instantly
      setComments([res.data, ...comments]);
      setNewComment('');
      setCommentCount(prev => prev + 1);
    } catch (err) {
      alert("Failed to post comment.");
    }
  };

  return (
    <>
      <style>{`
        @keyframes heartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .heart-pop {
          animation: heartPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .slide-down {
          animation: slideDown 0.3s ease-out;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .comment-enter {
          animation: slideDown 0.4s ease-out;
        }
      `}</style>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg shadow-gray-200/50 border border-white/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-300/50 hover:scale-[1.01]">
        
        {/* HEADER */}
        <div className="p-5 flex items-center justify-between">
          <Link to={`/profile/${post.author}`} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                {post.author_name ? post.author_name[0].toUpperCase() : '?'}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                {post.author_name}
              </h3>
              <p className="text-xs text-gray-500 font-medium">Just now • Public</p>
            </div>
          </Link>
          
          {/* More Options */}
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors group">
            <MoreHorizontal className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        </div>

        {/* CAPTION - Moved before media for better flow */}
        {post.caption && (
          <div className="px-5 pb-4">
            <p className="text-gray-800 text-sm leading-relaxed">
              {post.caption}
            </p>
          </div>
        )}

        {/* MEDIA */}
        {post.media_url && (
          <div className="w-full bg-gradient-to-br from-gray-900 to-black relative overflow-hidden group">
            {isVideo ? (
              <div className="relative">
                <video 
                  ref={videoRef}
                  className="w-full max-h-[500px] object-contain bg-black"
                  preload="metadata"
                  loop
                  muted={isMuted}
                  playsInline
                  onClick={toggleMute}
                  style={{ cursor: 'pointer' }}
                >
                  <source src={post.media_url} type={post.media_type === 'video' ? 'video/mp4' : undefined} />
                  Your browser does not support the video tag.
                </video>
                
                {/* Mute/Unmute Button - Instagram Style */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="absolute bottom-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-300 group/volume z-10"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white group-hover/volume:scale-110 transition-transform" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white group-hover/volume:scale-110 transition-transform" />
                  )}
                </button>

                {/* Tap to unmute hint (shows briefly on first load) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full transition-opacity duration-500 ${isMuted ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                    <p className="text-white text-sm font-semibold flex items-center gap-2">
                      <VolumeX className="w-4 h-4" />
                      Tap to unmute
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <img 
                  src={post.media_url} 
                  alt="Post content" 
                  className="w-full object-cover max-h-[500px] transition-transform duration-500 group-hover:scale-105" 
                />
                {/* Overlay on hover - only for images */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </>
            )}
          </div>
        )}

        {/* ACTIONS BAR */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-5">
              
              {/* LIKE BUTTON */}
              <button 
                onClick={handleLike} 
                className="flex items-center gap-2 group relative"
                disabled={isLiking}
              >
                <div className="relative">
                  <Heart 
                    className={`w-6 h-6 transition-all duration-300 ${
                      isLiked 
                        ? 'text-red-500 fill-red-500 heart-pop' 
                        : 'text-gray-500 group-hover:text-red-500 group-hover:scale-110'
                    }`}
                    strokeWidth={2.5}
                  />
                  {isLiking && !isLiked && (
                    <div className="absolute inset-0">
                      <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-ping" />
                    </div>
                  )}
                </div>
                <span className={`text-sm font-bold transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-600 group-hover:text-gray-900'
                }`}>
                  {likes}
                </span>
              </button>

              {/* COMMENT BUTTON */}
              <button 
                onClick={toggleComments} 
                className="flex items-center gap-2 group"
              >
                <MessageCircle 
                  className={`w-6 h-6 transition-all duration-300 ${
                    showComments
                      ? 'text-blue-600 fill-blue-100'
                      : 'text-gray-500 group-hover:text-blue-600 group-hover:scale-110'
                  }`}
                  strokeWidth={2.5}
                />
                <span className={`text-sm font-bold transition-colors ${
                  showComments ? 'text-blue-600' : 'text-gray-600 group-hover:text-gray-900'
                }`}>
                  {commentCount}
                </span>
              </button>

              {/* SHARE BUTTON */}
              <button className="group">
                <Send 
                  className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </button>
            </div>

            {/* SAVE BUTTON */}
            <button 
              onClick={handleSave} 
              className="group relative"
            >
              <Bookmark 
                className={`w-6 h-6 transition-all duration-300 ${
                  isSaved 
                    ? 'text-yellow-600 fill-yellow-600 scale-110' 
                    : 'text-gray-500 group-hover:text-yellow-600 group-hover:scale-110'
                }`}
                strokeWidth={2.5}
              />
              {isSaved && (
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* LIKE COUNT TEXT */}
          {likes > 0 && (
            <p className="text-xs font-bold text-gray-900 mb-3">
              {likes === 1 ? '1 like' : `${likes} likes`}
            </p>
          )}

          {/* COMMENTS SECTION */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-100 slide-down">
              
              {/* Comment Input */}
              {user ? (
                <form onSubmit={handlePostComment} className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 flex-shrink-0">
                    {user.profile_pic ? (
                      <img 
                        src={user.profile_pic} 
                        alt="You" 
                        className="w-full h-full rounded-full object-cover ring-2 ring-blue-100" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-blue-100">
                        {user.full_name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow relative">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..." 
                      className="w-full bg-gradient-to-br from-gray-50 to-blue-50/50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!newComment.trim()} 
                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg shadow-blue-500/30 disabled:shadow-none group"
                  >
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </form>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-5 border border-blue-100">
                  <p className="text-sm text-gray-600 text-center font-medium">
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">
                      Log in
                    </Link> to join the conversation
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No comments yet</p>
                    <p className="text-xs text-gray-400">Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map((comment, index) => (
                    <div key={comment.id} className="flex gap-3 comment-enter" style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-gray-600 shadow-sm">
                        {comment.author_name[0].toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100/50">
                          <p className="text-xs font-bold text-gray-900 mb-1">
                            {comment.author_name}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 px-2">
                          <button className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
                            Like
                          </button>
                          <button className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
                            Reply
                          </button>
                          <span className="text-xs text-gray-400">Just now</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export default PostCard;
import React, { useState, useRef, useEffect } from 'react';
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
  VolumeX,
  Loader2 // Imported Loader icon
} from 'lucide-react';

const PostCard = ({ post, user }) => {
  // --- STATE ---
  // Use 'likes_count' if available from serializer, fallback to 'likes'
  const [likes, setLikes] = useState(post.likes_count ?? (typeof post.likes === 'number' ? post.likes : post.likes?.length || 0));
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [isLiking, setIsLiking] = useState(false);
  
  // Comment State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Video State
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  // Constants
  const API_URL = 'https://connectly-socialmedia.onrender.com';
  // Robust check for video type
  const isVideo = post.media_type === 'video' || (post.media_url && post.media_url.match(/\.(mp4|webm|ogg|mov)$/i));

  // --- LIKE HANDLER ---
  const handleLike = async () => {
    if (!user) return alert("Please login to like.");
    if (isLiking) return; 
    
    // 1. Snapshot previous state for rollback
    const previousLiked = isLiked;
    const previousLikes = likes;

    // 2. Optimistic Update (Update UI Immediately)
    setIsLiking(true);
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const token = localStorage.getItem('access_token');
      // Call Backend
      await axios.post(`${API_URL}/api/posts/${post.id}/like/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Like failed", err);
      // Revert if API fails
      setIsLiked(previousLiked);
      setLikes(previousLikes);
    } finally {
      // Small delay to prevent spam-clicking
      setTimeout(() => setIsLiking(false), 500);
    }
  };

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    if (!user) return alert("Please login to save.");
    
    const previousSaved = isSaved;
    setIsSaved(!isSaved); // Optimistic

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_URL}/api/posts/${post.id}/save/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Save failed", err);
      setIsSaved(previousSaved); // Revert
    }
  };

  // --- COMMENTS HANDLER ---
  const toggleComments = async () => {
    if (!showComments) {
        // Fetch comments only when opening the section
        try {
            const token = localStorage.getItem('access_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${API_URL}/api/posts/${post.id}/comments/`, { headers });
            setComments(res.data);
        } catch (err) {
            console.error("Failed to load comments", err);
        }
    }
    setShowComments(!showComments);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsPostingComment(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`${API_URL}/api/posts/${post.id}/comments/`, 
        { content: newComment }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update State Immediately
      setComments([res.data, ...comments]); // Add new comment to top
      setNewComment('');
      setCommentCount(prev => prev + 1);
    } catch (err) {
      console.error("Failed to post comment", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setIsPostingComment(false);
    }
  };

  // --- VIDEO AUTOPLAY LOGIC ---
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.6 } // Play only when 60% visible
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isVideo]);

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // --- RENDER ---
  return (
    <>
      <style>{`
        @keyframes heartPop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .heart-pop { animation: heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all duration-300 hover:shadow-md">
        
        {/* HEADER */}
        <div className="p-4 flex items-center justify-between">
          <Link to={`/profile/${post.author}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px]">
               <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                  {/* Avatar Logic */}
                  <span className="font-bold text-gray-700">
                    {post.author_name ? post.author_name[0].toUpperCase() : '?'}
                  </span>
               </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                {post.author_name}
              </h3>
              <p className="text-xs text-gray-500">Just now • Public</p>
            </div>
          </Link>
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
             <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* CAPTION */}
        {post.caption && (
          <div className="px-5 pb-3">
            <p className="text-gray-800 text-sm leading-relaxed">{post.caption}</p>
          </div>
        )}

        {/* MEDIA */}
        {post.media_url && (
          <div className="relative bg-black group w-full overflow-hidden">
            {isVideo ? (
              <div className="relative w-full">
                <video 
                  ref={videoRef}
                  src={post.media_url} 
                  className="w-full max-h-[500px] object-contain bg-black"
                  loop muted={isMuted} playsInline onClick={toggleMute}
                  style={{cursor: 'pointer'}}
                />
                <button 
                   onClick={toggleMute}
                   className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition"
                >
                  {isMuted ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                </button>
              </div>
            ) : (
              <img 
                 src={post.media_url} 
                 alt="Post content" 
                 className="w-full max-h-[500px] object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
              />
            )}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              {/* Like */}
              <button onClick={handleLike} disabled={isLiking} className="group flex items-center gap-1 focus:outline-none">
                <Heart 
                   className={`w-7 h-7 transition-all duration-300 ${isLiked ? 'text-red-500 fill-red-500 heart-pop' : 'text-gray-500 group-hover:text-red-500'}`} 
                   strokeWidth={2}
                />
              </button>
              
              {/* Comment */}
              <button onClick={toggleComments} className="group focus:outline-none">
                <MessageCircle 
                   className={`w-7 h-7 transition-all duration-300 ${showComments ? 'text-blue-500 fill-blue-50' : 'text-gray-500 group-hover:text-blue-500'}`} 
                   strokeWidth={2}
                />
              </button>

              {/* Share */}
              <button className="group focus:outline-none">
                <Send className="w-7 h-7 text-gray-500 group-hover:text-blue-500 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" strokeWidth={2} />
              </button>
            </div>

            {/* Save */}
            <button onClick={handleSave} className="focus:outline-none">
               <Bookmark 
                  className={`w-7 h-7 transition-all duration-300 ${isSaved ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`} 
                  strokeWidth={2}
               />
            </button>
          </div>

          {/* Like Count */}
          <div className="font-bold text-sm text-gray-900 mb-2">
             {likes > 0 ? `${likes} likes` : 'Be the first to like this'}
          </div>

          {/* View Comments Link */}
          <button onClick={toggleComments} className="text-gray-500 text-sm hover:text-gray-700 mb-2">
             {commentCount > 0 ? `View all ${commentCount} comments` : 'Add a comment...'}
          </button>

          {/* COMMENTS SECTION */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
              
              {/* Input Form */}
              {user ? (
                <form onSubmit={handlePostComment} className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                      {user.profile_pic ? <img src={user.profile_pic} className="w-full h-full object-cover"/> : null}
                   </div>
                   <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..." 
                      className="flex-1 bg-gray-50 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                   />
                   <button 
                      type="submit" 
                      disabled={!newComment.trim() || isPostingComment}
                      className="text-blue-600 font-semibold text-sm disabled:opacity-50 hover:text-blue-700 transition"
                   >
                      {isPostingComment ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Post'}
                   </button>
                </form>
              ) : (
                <p className="text-center text-sm text-gray-500 mb-4">
                   <Link to="/login" className="text-blue-600 font-bold hover:underline">Log in</Link> to comment
                </p>
              )}

              {/* Comments List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">No comments yet.</div>
                ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600">
                           {c.author_name?.[0]}
                        </div>
                        <div className="flex-1">
                           <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2 inline-block">
                              <span className="font-bold text-xs text-gray-900 block mb-0.5">{c.author_name}</span>
                              <span className="text-sm text-gray-700">{c.content}</span>
                           </div>
                           <div className="flex gap-3 mt-1 ml-1">
                              <button className="text-[10px] font-semibold text-gray-500 hover:text-gray-800">Like</button>
                              <button className="text-[10px] font-semibold text-gray-500 hover:text-gray-800">Reply</button>
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
    </>
  );
};

export default PostCard;
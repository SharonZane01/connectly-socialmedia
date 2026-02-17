import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Send, Search, MoreVertical, Smile, Paperclip,
  Check, CheckCheck, Loader2, MessageSquare, ArrowLeft
} from 'lucide-react';

// ── Config ────────────────────────────────────────────────────
const API_BASE_URL = 'https://connectly-socialmedia.onrender.com';
const WS_BASE_URL  = 'wss://connectly-socialmedia.onrender.com';

// ── Helpers ───────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

const getAvatarColor = (id) =>
  AVATAR_COLORS[((id ?? 0) % AVATAR_COLORS.length)];

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const formatTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ── Sub-components ────────────────────────────────────────────
const Avatar = ({ user, size = 'md', online = false }) => {
  const dim =
    size === 'sm' ? 'w-9  h-9  text-xs'  :
    size === 'lg' ? 'w-12 h-12 text-base' :
                   'w-10 h-10 text-sm';

  return (
    <div className="relative flex-shrink-0">
      <div className={`${dim} rounded-full ${getAvatarColor(user?.id)} flex items-center justify-center font-semibold text-white overflow-hidden`}>
        {user?.profile_pic
          ? <img src={user.profile_pic} alt="" className="w-full h-full object-cover" />
          : getInitials(user?.full_name)}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

const TypingBubble = () => (
  <div className="flex justify-start mt-1">
    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────
const Chat = () => {
  const [users,           setUsers]           = useState([]);
  const [activeUser,      setActiveUser]      = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [newMessage,      setNewMessage]      = useState('');
  const [currentUser,     setCurrentUser]     = useState(null);
  const [isConnected,     setIsConnected]     = useState(false);
  const [onlineUsers,     setOnlineUsers]     = useState(new Set());
  const [typingUsers,     setTypingUsers]     = useState(new Set());
  const [isLoadingHistory,setIsLoadingHistory]= useState(false);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [unreadCounts,    setUnreadCounts]    = useState({});
  const [mobileView,      setMobileView]      = useState('list'); // 'list' | 'chat'

  const navigate         = useNavigate();
  const socketRef        = useRef(null);
  const messageEndRef    = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef         = useRef(null);

  // ── 1. Init: Load User & Contact List ──────────────────────
  useEffect(() => {
    const init = async () => {
      const token   = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');

      if (!token) { navigate('/login'); return; }
      if (userStr) setCurrentUser(JSON.parse(userStr));

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/users/find-people/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // CRITICAL FIX: Handle Pagination vs Array
        const userList = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setUsers(userList);
        
      } catch (err) {
        console.error('Failed to load users:', err);
        setUsers([]); // Fallback to empty to prevent map error
      }
    };
    init();
  }, [navigate]);

  // ── 2. Active user → fetch history + open WS ──────────────
  useEffect(() => {
    if (!activeUser || !currentUser) return;

    const token = localStorage.getItem('access_token');

    // Fetch history
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/chat/${activeUser.id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // CRITICAL FIX: Handle Pagination vs Array for messages
        const msgList = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setMessages(msgList);
        setUnreadCounts((p) => ({ ...p, [activeUser.id]: 0 }));
      } catch (err) {
        console.error('Failed to fetch history:', err);
        setMessages([]); 
      } finally {
        setIsLoadingHistory(false);
        scrollToBottom();
      }
    };
    fetchHistory();

    // WebSocket Connection
    if (socketRef.current) socketRef.current.close();

    const ws = new WebSocket(
      `${WS_BASE_URL}/ws/chat/${activeUser.id}/?token=${token}`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'presence', status: 'online' }));
    };
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'message':
          setMessages((p) => [...p, {
            sender:    data.sender_id,
            content:   data.message,
            timestamp: new Date().toISOString(),
            status:    'delivered',
          }]);
          scrollToBottom();
          if (data.sender_id !== activeUser.id && data.sender_id !== currentUser.id) {
            setUnreadCounts((p) => ({
              ...p,
              [data.sender_id]: (p[data.sender_id] || 0) + 1,
            }));
          }
          break;

        case 'typing':
          if (data.user_id !== currentUser.id) {
            setTypingUsers((p) => new Set(p).add(data.user_id));
            setTimeout(() => {
              setTypingUsers((p) => { const n = new Set(p); n.delete(data.user_id); return n; });
            }, 3000);
          }
          break;

        case 'presence':
          if (data.status === 'online') {
            setOnlineUsers((p) => new Set(p).add(data.user_id));
          } else {
            setOnlineUsers((p) => { const n = new Set(p); n.delete(data.user_id); return n; });
          }
          break;

        case 'read':
          setMessages((p) =>
            p.map((m) => m.sender === currentUser.id ? { ...m, status: 'read' } : m)
          );
          break;

        default:
          break;
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'presence', status: 'offline' }));
        ws.close();
      }
    };
  }, [activeUser, currentUser]);

  // ── 3. Send ───────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || socketRef.current?.readyState !== WebSocket.OPEN) return;
    
    socketRef.current.send(JSON.stringify({ type: 'message', message: newMessage }));
    setNewMessage('');
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    inputRef.current?.focus();
  };

  // ── 4. Typing ─────────────────────────────────────────────
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      if (!typingTimeoutRef.current) {
        socketRef.current.send(JSON.stringify({ type: 'typing', user_id: currentUser?.id }));
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
    }
  };

  // ── 5. Helpers ────────────────────────────────────────────
  const scrollToBottom = () => {
    setTimeout(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openChat = (u) => {
    setActiveUser(u);
    setMobileView('chat');
  };

  const goBack = () => {
    setMobileView('list');
  };

  const isTyping = activeUser && typingUsers.has(activeUser.id);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 top-16 flex overflow-hidden bg-gray-100">

      {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
      <aside className={`
        flex flex-col bg-white border-r border-gray-200
        w-full md:w-80 lg:w-96 flex-shrink-0
        ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}
      `}>

        {/* Sidebar Header */}
        <div className="flex-shrink-0 px-4 pt-5 pb-3 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
              <MessageSquare className="w-8 h-8 opacity-30" />
              <span>No conversations found</span>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isOnline = onlineUsers.has(u.id);
              const unread   = unreadCounts[u.id] || 0;
              const isActive = activeUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => openChat(u)}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer
                    border-l-4 transition-colors select-none
                    ${isActive
                      ? 'bg-blue-50 border-l-blue-500'
                      : 'border-l-transparent hover:bg-gray-50'}
                  `}
                >
                  <Avatar user={u} size="lg" online={isOnline} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${isActive ? 'font-semibold text-blue-700' : 'font-medium text-gray-900'}`}>
                        {u.full_name}
                      </span>
                      {unread > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 font-medium ${isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {isOnline ? '● Online' : '○ Offline'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ══ CHAT PANEL ═══════════════════════════════════════════ */}
      <main className={`
        flex-1 flex flex-col overflow-hidden min-w-0
        ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}
      `}>
        {activeUser ? (
          <>
            {/* Chat Header */}
            <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
              <button
                onClick={goBack}
                className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <Avatar user={activeUser} size="md" online={onlineUsers.has(activeUser.id)} />

              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 truncate leading-tight">
                  {activeUser.full_name}
                </p>
                <p className="text-xs mt-0.5 h-4 leading-tight">
                  {isTyping ? (
                    <span className="text-blue-500 font-medium animate-pulse">typing…</span>
                  ) : onlineUsers.has(activeUser.id) ? (
                    <span className="text-emerald-500 font-medium">Online</span>
                  ) : (
                    <span className="text-gray-400">Offline</span>
                  )}
                </p>
              </div>

              <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} title={isConnected ? 'Connected' : 'Disconnected'} />

              <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
                <MoreVertical className="w-5 h-5" />
              </button>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-0.5 bg-gray-50">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">No messages yet</p>
                  <p className="text-xs text-gray-400">Say hello to {activeUser.full_name} 👋</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isMe    = msg.sender === currentUser?.id;
                    const prevMsg = messages[i - 1];
                    const nextMsg = messages[i + 1];
                    const isFirst = !prevMsg || prevMsg.sender !== msg.sender;
                    const isLast  = !nextMsg || nextMsg.sender !== msg.sender;

                    return (
                      <div
                        key={i}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}
                      >
                        <div className={`
                          relative max-w-[80%] sm:max-w-[65%] px-3.5 py-2 shadow-sm
                          ${isMe
                            ? `bg-blue-500 text-white
                               ${isFirst ? 'rounded-t-2xl'   : 'rounded-t-md'}
                               ${isLast  ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-md'}`
                            : `bg-white text-gray-800
                               ${isFirst ? 'rounded-t-2xl'   : 'rounded-t-md'}
                               ${isLast  ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-md'}`
                          }
                        `}>
                          <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                          {isLast && (
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'opacity-80' : ''}`}>
                              <span className={`text-[10px] ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                {formatTime(msg.timestamp)}
                              </span>
                              {isMe && (
                                msg.status === 'read'
                                  ? <CheckCheck className="w-3 h-3 text-blue-200" />
                                  : <Check      className="w-3 h-3 text-blue-200" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && <TypingBubble />}
                </>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-200"
            >
              <button type="button" className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
                <Smile className="w-5 h-5" />
              </button>
              <button type="button" className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleTyping}
                disabled={!isConnected}
                placeholder={isConnected ? 'Type a message…' : 'Connecting…'}
                autoComplete="off"
                className="flex-1 min-w-0 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-700">Your Messages</h2>
              <p className="text-sm text-gray-400 mt-1">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;
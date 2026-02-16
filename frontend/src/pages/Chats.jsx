import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Send, Search, Phone, Video, MoreVertical, Smile, Paperclip, Check, CheckCheck } from 'lucide-react';

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);

  // 1. Initial Setup: Load My Info & User List
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');

      if (!token) {
          navigate('/login');
          return;
      }

      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }

      try {
        const res = await axios.get('http://127.0.0.1:8000/api/users/find-people/', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };
    init();
  }, [navigate]);

  // 2. Handle Active User Change (Fetch History + Connect WS)
  useEffect(() => {
    if (!activeUser || !currentUser) return;

    const token = localStorage.getItem('access_token');

    // A. Fetch Chat History
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/chat/${activeUser.id}/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
        scrollToBottom();
        
        // Clear unread count for active user
        setUnreadCounts(prev => ({ ...prev, [activeUser.id]: 0 }));
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();

    // B. Connect WebSocket
    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${activeUser.id}/?token=${token}`;
    
    if (socketRef.current) {
        socketRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
        
        // Send presence notification
        ws.send(JSON.stringify({ 
          type: 'presence',
          status: 'online'
        }));
    };

    ws.onclose = () => {
        console.log("WebSocket Disconnected");
        setIsConnected(false);
    };

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setIsConnected(false);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        switch(data.type) {
          case 'message':
            setMessages(prev => [
                ...prev,
                {
                    sender: data.sender_id,
                    content: data.message,
                    timestamp: new Date().toISOString(),
                    status: 'delivered'
                }
            ]);
            scrollToBottom();
            
            // Update unread count if not active chat
            if (data.sender_id !== currentUser?.id && data.sender_id !== activeUser?.id) {
              setUnreadCounts(prev => ({
                ...prev,
                [data.sender_id]: (prev[data.sender_id] || 0) + 1
              }));
            }
            break;
            
          case 'typing':
            if (data.user_id !== currentUser?.id) {
              setTypingUsers(prev => new Set(prev).add(data.user_id));
              setTimeout(() => {
                setTypingUsers(prev => {
                  const next = new Set(prev);
                  next.delete(data.user_id);
                  return next;
                });
              }, 3000);
            }
            break;
            
          case 'presence':
            if (data.status === 'online') {
              setOnlineUsers(prev => new Set(prev).add(data.user_id));
            } else {
              setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(data.user_id);
                return next;
              });
            }
            break;
            
          case 'read':
            setMessages(prev => prev.map(msg => 
              msg.sender === currentUser?.id ? { ...msg, status: 'read' } : msg
            ));
            break;
            
          default:
            // Legacy message format support
            setMessages(prev => [
                ...prev,
                {
                    sender: data.sender_id,
                    content: data.message,
                    timestamp: new Date().toISOString()
                }
            ]);
            scrollToBottom();
        }
    };

    return () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'presence',
              status: 'offline'
            }));
            ws.close();
        }
    };

  }, [activeUser, currentUser]);

  // 3. Send Message
  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket is not connected.");
        return;
    }

    socketRef.current.send(JSON.stringify({ 
      type: 'message',
      message: newMessage 
    }));
    
    // Stop typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    setNewMessage("");
  };

  // 4. Handle Typing Indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && socketRef.current?.readyState === WebSocket.OPEN) {
      setIsTyping(true);
      socketRef.current.send(JSON.stringify({ 
        type: 'typing',
        user_id: currentUser?.id
      }));
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  // 5. Auto Scroll
  const scrollToBottom = () => {
    setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 6. Filter Users
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 7. Format Time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      
      {/* LEFT SIDEBAR: User List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white mb-3">Messages</h2>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
              />
            </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map(u => {
              const isOnline = onlineUsers.has(u.id);
              const unreadCount = unreadCounts[u.id] || 0;
              
              return (
                <div 
                    key={u.id} 
                    onClick={() => setActiveUser(u)}
                    className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-all duration-200 border-l-4 ${
                      activeUser?.id === u.id 
                        ? 'bg-blue-50 border-blue-600 shadow-inner' 
                        : 'border-transparent'
                    }`}
                >
                    {/* Profile Picture with Online Status */}
                    <div className="relative mr-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white overflow-hidden shadow-md">
                          {u.profile_pic ? (
                            <img src={u.profile_pic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">{u.full_name?.[0]?.toUpperCase()}</span>
                          )}
                      </div>
                      {/* Online Indicator */}
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white transition-colors duration-300 ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold text-gray-900 truncate">{u.full_name}</h3>
                          {unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full animate-pulse">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {isOnline ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Chat Area */}
      <div className="w-2/3 flex flex-col">
        {activeUser ? (
            <>
                {/* Chat Header */}
                <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-md z-10">
                    <div className="flex items-center">
                      {/* Profile Picture */}
                      <div className="relative mr-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white overflow-hidden">
                            {activeUser.profile_pic ? (
                              <img src={activeUser.profile_pic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              activeUser.full_name?.[0]?.toUpperCase()
                            )}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          onlineUsers.has(activeUser.id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      
                      <div>
                        <h2 className="font-bold text-lg text-gray-900">{activeUser.full_name}</h2>
                        <p className="text-xs text-gray-500">
                          {typingUsers.has(activeUser.id) ? (
                            <span className="text-blue-600 font-medium animate-pulse">typing...</span>
                          ) : onlineUsers.has(activeUser.id) ? (
                            'Active now'
                          ) : (
                            'Offline'
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                        <Video className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      
                      {/* Connection Status Badge */}
                      <div className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                        isConnected 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`}></span>
                        {isConnected ? 'Connected' : 'Connecting...'}
                      </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                          <Send className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isMe = msg.sender === currentUser?.id;
                        const showTimestamp = index === 0 || 
                          new Date(msg.timestamp) - new Date(messages[index - 1].timestamp) > 300000; // 5 minutes
                        
                        return (
                            <div key={index} className="animate-fadeIn">
                              {/* Timestamp Divider */}
                              {showTimestamp && (
                                <div className="flex justify-center my-4">
                                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                    {formatTime(msg.timestamp)}
                                  </span>
                                </div>
                              )}
                              
                              {/* Message Bubble */}
                              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                  <div className={`relative max-w-xs px-4 py-2 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg ${
                                      isMe 
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                  }`}>
                                      <p className="break-words">{msg.content}</p>
                                      
                                      {/* Message Status for sent messages */}
                                      {isMe && (
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                          <span className="text-xs opacity-70">
                                            {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                                              hour: 'numeric', 
                                              minute: '2-digit' 
                                            })}
                                          </span>
                                          {msg.status === 'read' ? (
                                            <CheckCheck className="w-3 h-3 text-blue-200" />
                                          ) : (
                                            <Check className="w-3 h-3 text-blue-200" />
                                          )}
                                        </div>
                                      )}
                                  </div>
                              </div>
                            </div>
                        );
                      })
                    )}
                    
                    {/* Typing Indicator */}
                    {typingUsers.has(activeUser.id) && (
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-md">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messageEndRef}></div>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 shadow-lg">
                    <div className="flex items-center gap-3">
                        {/* Emoji Button */}
                        <button 
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                          <Smile className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        {/* Attachment Button */}
                        <button 
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                          <Paperclip className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        {/* Message Input */}
                        <input 
                            type="text" 
                            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={handleTyping}
                            disabled={!isConnected}
                        />
                        
                        {/* Send Button */}
                        <button 
                          type="submit" 
                          disabled={!isConnected || !newMessage.trim()} 
                          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Typing Indicator for Current User */}
                    {isTyping && (
                      <p className="text-xs text-gray-400 mt-2 ml-14 animate-pulse">You are typing...</p>
                    )}
                </form>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-white">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Send className="w-16 h-16 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">Welcome to Chat</h3>
                <p className="text-gray-400">Select a conversation to start messaging</p>
            </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Chat;
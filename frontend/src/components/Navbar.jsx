import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Home, 
  Compass, 
  Bell, 
  MessageCircle, 
  LogOut, 
  User,
  Sparkles
} from "lucide-react";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(3);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link
        to={to}
        className={`
          relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl
          transition-all duration-300 ease-out group
          ${isActive 
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm' 
            : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
          }
        `}
      >
        <div className="relative">
          <Icon 
            className={`
              w-5 h-5 transition-transform duration-300
              ${isActive ? 'scale-110' : 'group-hover:scale-110'}
            `}
            strokeWidth={isActive ? 2.5 : 2}
          />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {badge}
            </span>
          )}
        </div>
        
        <span className={`
          hidden md:block text-sm font-semibold tracking-tight
          transition-all duration-300
          ${isActive ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}
        `}>
          {label}
        </span>

        {isActive && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20 animate-pulse" />
        )}
      </Link>
    );
  };

  return (
    <>
      <style>{`
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

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
          }
        }

        .nav-animate {
          animation: slideDown 0.5s ease-out;
        }

        .logo-glow {
          animation: glow 3s ease-in-out infinite;
        }
      `}</style>

      <nav className={`
        sticky top-0 z-50 transition-all duration-300 nav-animate
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-2xl shadow-lg shadow-gray-200/50' 
          : 'bg-white/70 backdrop-blur-xl border-b border-gray-100'
        }
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* LOGO */}
            <Link
              to="/"
              className="flex items-center gap-3 group relative"
            >
              <div className="relative">
                <div className={`
                  w-11 h-11 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 
                  rounded-2xl flex items-center justify-center text-white font-black text-xl
                  shadow-lg shadow-blue-500/30 
                  transition-all duration-300 ease-out
                  group-hover:scale-110 group-hover:rotate-3
                  ${isScrolled ? 'logo-glow' : ''}
                `}>
                  <span className="relative z-10">C</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Connectly
                </span>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase -mt-1">
                  Social Network
                </span>
              </div>
            </Link>

            {/* CENTER NAV */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-3xl backdrop-blur-sm border border-gray-100">
              <NavItem to="/" icon={Home} label="Home" />
              
              {user && (
                <>
                  <NavItem to="/find-people" icon={Compass} label="Discover" />
                  <NavItem to="/chat" icon={MessageCircle} label="Messages" badge={0} />
                  <NavItem to="/notifications" icon={Bell} label="Notifications" badge={notifications} />
                </>
              )}
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Profile Button */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl hover:bg-gray-50 transition-all duration-300 group border border-transparent hover:border-gray-100"
                  >
                    <div className="relative">
                      {user.profile_pic ? (
                        <img
                          src={user.profile_pic}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300">
                          {user.full_name[0].toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                    </div>

                    <div className="hidden xl:block">
                      <p className="text-sm font-bold text-gray-900 leading-tight">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        View Profile
                      </p>
                    </div>

                    <User className="hidden xl:block w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 group border border-red-100 hover:border-red-200"
                  >
                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="hidden sm:block">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <Link
                    to="/login"
                    className="px-5 py-2.5 font-bold text-sm text-gray-700 hover:text-gray-900 rounded-2xl hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200"
                  >
                    Login
                  </Link>

                  {/* Signup Button */}
                  <Link
                    to="/signup"
                    className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Join Now
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Bottom Nav */}
        {user && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-200 px-4 py-3 z-50 shadow-2xl shadow-gray-900/10">
            <div className="flex justify-around items-center max-w-md mx-auto">
              <NavItem to="/" icon={Home} label="" />
              <NavItem to="/find-people" icon={Compass} label="" />
              <NavItem to="/chat" icon={MessageCircle} label="" badge={0} />
              <NavItem to="/notifications" icon={Bell} label="" badge={notifications} />
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
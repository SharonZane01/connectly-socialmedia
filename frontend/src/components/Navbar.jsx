import { Link } from 'react-router-dom';



const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
};

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 py-3 px-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-black tracking-tighter text-blue-600">
          CONNECTLY<span className="text-gray-400">.</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-gray-500 hover:text-blue-600 font-medium transition">Home</Link>
          <Link to="/login" className="text-gray-500 hover:text-blue-600 font-medium transition">Login</Link>
          <Link to="/signup" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95">
            Join Now
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;



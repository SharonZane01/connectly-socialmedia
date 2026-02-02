import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/users/login/', {
        email,
        password,
      });

      // 1. Save Token & User Info
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('user', JSON.stringify({
        full_name: res.data.full_name,
        email: res.data.email
      }));

      alert("Welcome back!");
      navigate('/'); 
    } catch (err) {
      console.error(err);
      alert("Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 w-96 border border-gray-100">
        <h2 className="text-3xl font-black mb-6 text-center text-gray-900">Welcome Back</h2>
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email" required
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button 
          disabled={loading}
          className="w-full mt-8 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default Login;
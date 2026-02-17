import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const API_URL = "https://connectly-socialmedia.onrender.com/api/users/login/";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(API_URL, formData);

      // 1. Save Tokens
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      // 2. Save User Info
      // Ensure we handle cases where backend might send different field names
      const userData = {
        full_name: res.data.full_name || "User",
        email: res.data.email || formData.email,
        // Add profile_pic if your login endpoint returns it, otherwise Home fetches it
      };
      localStorage.setItem("user", JSON.stringify(userData));

      // 3. Notify App (Updates Navbar)
      window.dispatchEvent(new Event("login"));

      // 4. Success & Redirect
      toast.success(`Welcome back, ${userData.full_name.split(' ')[0]}!`);
      
      // Small delay to let the user read the toast
      setTimeout(() => navigate("/"), 1000);

    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || "Invalid Email or Password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-4">
        
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-white/50 relative overflow-hidden">
          
          {/* Decorative Top Gradient */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email Input */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                autoComplete="email"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-gray-700"
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-gray-700"
                onChange={handleChange}
              />
            </div>

            {/* Forgot Password Link (Optional Placeholder) */}
            <div className="flex justify-end">
              <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-gray-400 text-xs font-medium uppercase">Or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 font-bold hover:underline">
                Register now
              </Link>
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;
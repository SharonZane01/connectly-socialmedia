import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { ShieldCheck, KeyRound, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

const API_URL = "https://connectly-socialmedia.onrender.com/api/users/verify-otp/";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Safe access to email
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if no email is present (prevent manual access)
  useEffect(() => {
    if (!email) {
      toast.error("No email found. Please register first.");
    }
  }, [email]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(API_URL, {
        email: email,
        otp: otp,
      });

      toast.success(res.data.message || "Email verified successfully!");

      // Delay for user experience
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      console.error(err.response?.data);
      const errorMessage = err.response?.data?.error || "Invalid OTP. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 1. Error State: No Email found in navigation state
  if (!email) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-6">
            We couldn't find an email address to verify. Please start the registration process again.
          </p>
          <Link 
            to="/register" 
            className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Go to Register
          </Link>
        </div>
      </div>
    );
  }

  // 2. Main Render
  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-4">
        
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-white/50 relative overflow-hidden">
          
          {/* Decorative Top Gradient */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

          {/* Icon Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Verify Account</h2>
            <p className="text-gray-500 text-sm">
              We've sent a code to <br />
              <span className="font-semibold text-gray-800">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            
            {/* OTP Input */}
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-gray-700 tracking-widest text-lg"
                onChange={(e) => setOtp(e.target.value)}
              />
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
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Now</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 text-center space-y-4">
             {/* Resend Placeholder (Optional) */}
            <p className="text-sm text-gray-500">
              Didn't receive code?{' '}
              <button className="text-blue-600 font-bold hover:underline">
                Resend
              </button>
            </p>

            <Link 
              to="/login" 
              className="inline-block text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to Login
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default VerifyEmail;
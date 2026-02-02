import { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email; // Get email passed from Signup

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/users/verify-otp/', { email, otp });
      alert("Verification successful!");
      navigate('/login');
    } catch (err) {
      alert("Invalid OTP, try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl w-96 border border-gray-100 text-center">
        <h2 className="text-2xl font-black mb-2">Check your Email</h2>
        <p className="text-gray-500 mb-6 text-sm">We sent a code to {email}</p>
        <form onSubmit={handleVerify}>
          <input 
            type="text" placeholder="6-Digit Code"
            className="w-full p-4 bg-gray-50 rounded-2xl text-center text-2xl tracking-widest font-bold outline-none border-2 focus:border-blue-500"
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700">
            Verify Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
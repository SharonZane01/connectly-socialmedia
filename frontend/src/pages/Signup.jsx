import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Direct call to Django (No Cloudinary needed now)
      await axios.post('http://127.0.0.1:8000/api/users/register/', formData);
      
      alert("Signup successful! Please verify your email.");
      navigate('/verify-email', { state: { email: formData.email } });

    } catch (err) {
      console.error(err);
      alert("Signup failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10 min-h-[80vh]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-black mb-6 text-center text-gray-900">Create Account</h2>
        
        <div className="space-y-4">
          <input 
            type="text" placeholder="Full Name" required
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
          <input 
            type="email" placeholder="Email Address" required
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full mt-8 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:bg-gray-400"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
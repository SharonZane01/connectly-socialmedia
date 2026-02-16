import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/users/register/",
        {
          full_name: fullName,
          email: email,
          password: password,
        }
      );

      alert(res.data.message);

      // Go to verify page and pass email
      navigate("/verify-email", {
        state: { email },
      });

    } catch (err) {
      console.error(err.response?.data);
      alert(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-3xl shadow-xl w-96 border"
      >
        <h2 className="text-3xl font-black mb-6 text-center">
          Create Account
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            required
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
            onChange={(e) => setFullName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            required
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />

        </div>

        <button
          disabled={loading}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-2xl font-bold"
        >
          {loading ? "Sending OTP..." : "Signup"}
        </button>

      </form>
    </div>
  );
};

export default Signup;

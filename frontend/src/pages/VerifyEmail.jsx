import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/users/verify-otp/",
        {
          email: email,
          otp: otp,
        }
      );

      alert(res.data.message);

      navigate("/login");

    } catch (err) {
      console.error(err.response?.data);
      alert(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center mt-10">
        No email found. Please signup again.
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-[80vh]">

      <form
        onSubmit={handleVerify}
        className="bg-white p-8 rounded-3xl shadow-xl w-96 border"
      >

        <h2 className="text-3xl font-black mb-4 text-center">
          Verify OTP
        </h2>

        <p className="text-sm text-gray-500 mb-4 text-center">
          OTP sent to {email}
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          required
          className="w-full p-4 bg-gray-50 rounded-2xl outline-none"
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-2xl font-bold"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

      </form>

    </div>
  );
};

export default VerifyEmail;

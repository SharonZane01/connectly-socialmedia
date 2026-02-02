import { useState } from 'react';
import axios from 'axios';

// --- CLOUDINARY CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = 'dbjbc21bz';   // <--- Your Cloud Name
const CLOUDINARY_UPLOAD_PRESET = 'cloud123'; // <--- Your Upload Preset

const CreatePostModal = ({ isOpen, onClose, onPostCreated, user }) => {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!image) return alert("Please select an image!");
    setLoading(true);

    try {
      // --- STEP 1: Upload to Cloudinary ---
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); 

      // Note: We use `fetch` here because it handles FormData boundaries better than Axios in some cases
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, 
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudData = await cloudRes.json();

      if (!cloudData.secure_url) {
        throw new Error("Cloudinary upload failed: " + (cloudData.error?.message || "Unknown error"));
      }

      const imageUrl = cloudData.secure_url;

      // --- STEP 2: Save Post to Django ---
      const token = localStorage.getItem('access_token');
      
      await axios.post('http://127.0.0.1:8000/api/posts/', {
        caption: caption,
        image: imageUrl, 
        // No 'user' field sent; backend handles it automatically
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // --- STEP 3: Cleanup & Close ---
      setCaption('');
      setImage(null);
      setPreview(null);
      onPostCreated(); 
      onClose();
      
    } catch (err) {
      console.error("Post failed:", err);
      alert("Failed to create post. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-gray-900 text-lg">Create New Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <textarea 
            className="w-full p-4 bg-gray-50 rounded-2xl border border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none resize-none h-32 text-gray-700 placeholder-gray-400 transition-all font-medium"
            placeholder={`What's on your mind, ${user.full_name?.split(' ')[0]}?`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <div className="relative group">
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
                <button 
                  onClick={() => { setImage(null); setPreview(null); }}
                  className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-sm text-gray-500 font-bold group-hover:text-blue-600">Click to upload photo</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button 
            onClick={handleSubmit} 
            disabled={loading || !image}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-blue-200 disabled:shadow-none flex items-center space-x-2"
          >
            {loading && <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>}
            <span>{loading ? "Posting..." : "Post"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
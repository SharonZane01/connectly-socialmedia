import { useState } from "react";
import axios from "axios";

const CLOUDINARY_CLOUD_NAME = "dbjbc21bz";
const CLOUDINARY_UPLOAD_PRESET = "cloud123";

const MAX_FILE_SIZE_MB = 50; // adjust if needed

const CreatePostModal = ({ isOpen, onClose, onPostCreated, user }) => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Validate size
    const sizeMB = selected.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      alert(`File must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    const type = selected.type.startsWith("video") ? "video" : "image";

    setFile(selected);
    setMediaType(type);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please select a file!");
    setLoading(true);

    try {
      // STEP 1 — Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudData = await cloudRes.json();

      if (!cloudData.secure_url) {
        throw new Error(
          "Cloudinary upload failed: " +
            (cloudData.error?.message || "Unknown error")
        );
      }

      const mediaUrl = cloudData.secure_url;

      // STEP 2 — Save to Django
      const token = localStorage.getItem("access_token");

      await axios.post(
        "http://127.0.0.1:8000/api/posts/",
        {
          caption: caption,
          media_url: mediaUrl,
          media_type: mediaType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // STEP 3 — Reset
      setCaption("");
      setFile(null);
      setPreview(null);
      setMediaType(null);
      onPostCreated();
      onClose();
    } catch (err) {
      console.error("Post failed:", err);
      alert("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setMediaType(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-black text-lg">Create New Post</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <textarea
            className="w-full p-4 bg-gray-50 rounded-2xl resize-none h-28"
            placeholder={`What's on your mind, ${
              user?.full_name?.split(" ")[0] || "User"
            }?`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          {preview ? (
            <div className="relative rounded-2xl overflow-hidden">
              {mediaType === "video" ? (
                <video
                  src={preview}
                  controls
                  className="w-full h-64 object-cover"
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover"
                />
              )}

              <button
                onClick={removeFile}
                className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50">
              <p className="text-gray-500 font-semibold">
                Click to upload image or video
              </p>
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl disabled:bg-gray-300"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;

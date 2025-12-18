"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";

export default function SetupUsername() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      await axios.post("http://127.0.0.1:8000/users/set-username", {
        user_id: user.uid,
        username: username
      });
      
      window.location.href = "/profile"; 
      
    } catch (err: any) {
      console.error("Full Error Object:", err); // <--- Log it to see what's wrong

      // SAFE ERROR HANDLING
      if (err.response && err.response.data) {
        // Server responded with a specific error (e.g. "Username taken")
        alert(err.response.data.detail);
      } else if (err.request) {
        // Server is DOWN or URL is WRONG (Network Error)
        alert("Cannot connect to server. Is the Backend running?");
      } else {
        // Something else happened
        alert("An unexpected error occurred.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-xl font-bold mb-4">Create your Handle</h1>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
          placeholder="e.g. failure_king"
          className="w-full border p-2 mb-4 rounded"
        />
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Set Username"}
        </button>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";
// ✅ Direct auth import from your config
import { auth } from "@/firebase/config"; 

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Using the imported 'auth' directly
      await signInWithEmailAndPassword(auth, email, pass);
      router.push("/admin");
    } catch (err: any) {
      console.error("Login Error:", err.code);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid Admin Credentials");
      } else {
        setError("Access Denied: Unauthorized");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full" />

        <div className="flex flex-col items-center mb-10 text-center relative z-10">
           <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white mb-4 rotate-3 shadow-xl shadow-red-900/20">
              <Lock size={28} />
           </div>
           <h1 className="text-white font-black italic text-2xl uppercase tracking-tighter">Admin Portal</h1>
           <p className="text-gray-500 text-[9px] font-black uppercase mt-2 tracking-[0.2em] italic">RamKesar Foods • Secure Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 mb-2">
              <AlertCircle size={16} />
              <p className="text-[10px] font-black uppercase">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-500 uppercase ml-4">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="admin@ramkesar.com" 
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold text-xs outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-500 uppercase ml-4">Access Key</label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold text-xs outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
              onChange={(e) => setPass(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-xs uppercase italic tracking-widest shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Verifying..." : "Secure Entry"} <ShieldCheck size={18}/>
          </button>
        </form>

        <p className="text-center mt-8 text-[8px] font-bold text-gray-700 uppercase tracking-widest italic">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}

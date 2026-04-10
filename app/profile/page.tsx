"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { 
  User, MapPin, ArrowLeft, ShoppingBag, LogOut, 
  ShieldCheck, ChevronRight, Star, Clock, Heart, 
  PhoneCall, Mail, BadgeCheck, Zap, Coins, Info
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUserToFirebase = async () => {
      const savedUser = localStorage.getItem("rk_user");
      const savedAddr = localStorage.getItem("rk_address");

      if (!savedUser) {
        router.push("/");
        return;
      }

      const localData = JSON.parse(savedUser);
      const addressData = savedAddr ? JSON.parse(savedAddr).text : "Location not set";
      const userPhone = localData.phone;

      try {
        // 1. Pehle check karo ki user Firebase mein exists karta hai?
        const userRef = doc(db, "users", userPhone);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // 2. Agar nahi hai, toh pehli baar data bhejo (Role: Customer)
          const newUser = {
            name: localData.name,
            phone: userPhone,
            address: addressData,
            role: "Customer", // Default role
            coins: 50, // Welcome bonus coins
            createdAt: new Date().toISOString(),
          };
          await setDoc(userRef, newUser);
          setProfile(newUser);
        }

        // 3. Real-time Listener lagao taaki Coins/Role update hote hi dikhe
        const unsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const firestoreData = snap.data();
            setProfile(firestoreData);
            // Local storage ko bhi update rakho synced rehne ke liye
            localStorage.setItem("rk_user", JSON.stringify(firestoreData));
          }
          setLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error("Firebase Sync Error:", err);
        setLoading(false);
      }
    };

    syncUserToFirebase();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("rk_user");
    router.push("/");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFB] pb-24 font-sans">
      {/* HEADER */}
      <header className="p-5 bg-white border-b flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 bg-gray-50 rounded-full active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black italic text-lg uppercase tracking-tighter text-gray-900">Dashboard</h1>
        </div>
        {/* REAL COINS SHOWING FROM FIREBASE */}
        <div className="bg-yellow-100 px-4 py-2 rounded-2xl flex items-center gap-2 border border-yellow-200 shadow-sm">
           <Coins size={16} className="text-yellow-600" />
           <span className="text-sm font-black text-yellow-700">{profile?.coins || 0}</span>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {/* PROFILE CARD */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden mb-6">
           <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black italic shadow-lg mb-4">
              {profile?.name?.charAt(0)}
           </div>
           
           <div className="flex items-center gap-2">
             <h2 className="text-xl font-black italic uppercase text-gray-900">{profile?.name}</h2>
             <BadgeCheck size={18} className="text-blue-500" />
           </div>
           
           <p className="text-gray-400 font-bold text-[10px] mt-1 uppercase tracking-widest">+91 {profile?.phone}</p>
           
           <div className="mt-3 bg-black text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase italic tracking-wider">
             {profile?.role || "Customer"}
           </div>

           {/* REAL ADDRESS FROM HOME PAGE */}
           <div className="w-full mt-8 pt-6 border-t border-gray-50 flex items-start gap-4">
              <div className="bg-red-50 p-3 rounded-2xl text-red-600"><MapPin size={20}/></div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Saved Address</p>
                <p className="text-[11px] font-bold text-gray-700 leading-relaxed italic">
                  {profile?.address || "No address found"}
                </p>
              </div>
           </div>
        </div>

        {/* SUPPORT & ACTIONS */}
        <h3 className="px-6 mb-4 font-black text-[10px] uppercase text-gray-400 tracking-[0.3em]">RamKesar Support</h3>
        <div className="bg-white rounded-[2.5rem] p-3 border border-gray-100 shadow-sm space-y-2 mb-6">
           <a href="tel:9873644504" className="flex items-center justify-between p-4 hover:bg-green-50 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform"><PhoneCall size={18}/></div>
                 <span className="font-black text-[11px] uppercase italic text-gray-700">Call 9873644504</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
           </a>
           
           <a href="mailto:ramkesarfoods@gmail.com" className="flex items-center justify-between p-4 hover:bg-blue-50 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><Mail size={18}/></div>
                 <span className="font-black text-[11px] uppercase italic text-gray-700">Email Support</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
           </a>
        </div>

        {/* LEGAL BITS */}
        <div className="bg-white rounded-[2.5rem] p-3 border border-gray-100 shadow-sm space-y-1 mb-8">
           <div onClick={() => alert("Privacy: RamKesar values your privacy. We use your data only for delivery.")} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl cursor-pointer group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-red-500"><ShieldCheck size={18}/></div>
                 <span className="font-black text-[11px] uppercase italic text-gray-700">Privacy Policy</span>
              </div>
           </div>
           <div onClick={() => alert("Terms: Minimum order value ₹100. Delivery time depends on traffic/distance.")} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl cursor-pointer group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-red-500"><Info size={18}/></div>
                 <span className="font-black text-[11px] uppercase italic text-gray-700">Terms of Service</span>
              </div>
           </div>
        </div>

        {/* LOGOUT */}
        <button onClick={handleLogout} className="w-full py-5 text-red-600 font-black text-xs uppercase italic tracking-widest bg-red-50 rounded-[2rem] border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm">
           Log Out Account
        </button>
      </div>
    </div>
  );
}

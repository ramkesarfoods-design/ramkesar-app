"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from "@/firebase/config"; 
import { 
  doc, updateDoc, onSnapshot, collection, 
  query, where, getDocs, Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Bell, MapPin, Navigation, Phone, Wallet, History, 
  Power, ShieldAlert, Menu, X, Camera, User, LogOut, 
  PackageCheck, Truck, MessageCircle, Coffee, Volume2, 
  VolumeX 
} from 'lucide-react';

export default function RiderPanel() {
  // --- 1. CORE STATES (LOCKED) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [riderData, setRiderData] = useState<any>(null);
  const [loginInput, setLoginInput] = useState({ name: '', number: '', aadhar: '' });
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isBreakMode, setIsBreakMode] = useState(false);
  
  // --- 2. UI STATES ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');

  // --- 3. DATA & ORDER STATES ---
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [allHistoryOrders, setAllHistoryOrders] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ totalCut: 0, codToDeposit: 0, totalOrders: 0 });

  // --- 4. AUTH LOGIC (LOCKED) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(collection(db, "riders"), where("number", "==", loginInput.number.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { alert("Rider not found!"); } 
      else {
        const dbData = snap.docs[0].data();
        if (String(dbData.aadhar).replace(/\s/g, "") === loginInput.aadhar.replace(/\s/g, "")) {
          setRiderData({ id: snap.docs[0].id, ...dbData });
          setIsLoggedIn(true);
        } else { alert("Aadhar Mismatch!"); }
      }
    } catch (err) { alert("Login Error!"); } finally { setLoading(false); }
  };

  // --- 5. FIXED REAL-TIME MONITOR (THE FIX) ---
  useEffect(() => {
    if (!isLoggedIn || !isOnline || isBreakMode) return;

    // Yahan humne saare possible statuses add kar diye hain jo Admin bhej sakta hai
    const qDispatch = query(
      collection(db, "dispatch"), 
      where("riderDetails.number", "==", riderData.number),
      where("status", "in", [
        "Preparing", 
        "preparing", 
        "assigned", 
        "Out for Delivery", 
        "out for delivery", 
        "accepted", 
        "picked"
      ]) 
    );
    
    const unsubDispatch = onSnapshot(qDispatch, (snap) => {
      console.log("Found matching orders:", snap.size); // Debugging line
      if (!snap.empty) {
        // Hamesha sabse latest order uthayein
        const orderData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setActiveOrder(orderData);

        // Agar order Delivered nahi hai aur naya hai, toh sound bajao
        if (["Preparing", "preparing", "assigned", "Out for Delivery", "out for delivery"].includes(orderData.status)) {
          playAlert();
        } else {
          stopAlert();
        }
      } else {
        setActiveOrder(null);
        stopAlert();
      }
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubDispatch();
  }, [isLoggedIn, isOnline, isBreakMode, riderData]);

  // --- History Listener ---
  useEffect(() => {
    if (!isLoggedIn) return;
    const qHistory = query(
      collection(db, "dispatch"), 
      where("riderDetails.number", "==", riderData.number), 
      where("status", "==", "delivered")
    );
    return onSnapshot(qHistory, (snap) => {
      setAllHistoryOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [isLoggedIn, riderData]);

  // --- 6. EARNINGS (80% Rider, 20% Admin) ---
  useEffect(() => {
    const now = new Date();
    const filtered = allHistoryOrders.filter(order => {
      if (dateFilter === 'all') return true;
      const orderDate = order.dispatchedAt?.toDate() || new Date();
      return orderDate.toDateString() === now.toDateString();
    });

    let riderNet = 0; let cod = 0;
    filtered.forEach(order => {
      riderNet += Number(order.deliveryFee || 0) * 0.8; 
      if (String(order.paymentMethod).toLowerCase() === 'cod') cod += Number(order.total || 0); 
    });
    setFilteredHistory(filtered);
    setEarnings({ totalCut: riderNet, codToDeposit: cod, totalOrders: filtered.length });
  }, [dateFilter, allHistoryOrders]);

  // --- 7. ACTIONS ---
  const playAlert = () => {
    if (!soundEnabled) return;
    if (!audioRef.current) audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3');
    audioRef.current.loop = true;
    audioRef.current.play().catch(() => {});
  };

  const stopAlert = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const updateStatus = async (newStatus: string) => {
    if (!activeOrder) return;
    stopAlert(); 
    await updateDoc(doc(db, "dispatch", activeOrder.id), { status: newStatus });
  };

  const handlePhotoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !activeOrder) return;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `delivery_proofs/${activeOrder.id}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "dispatch", activeOrder.id), { 
        deliveryPhoto: url, 
        status: 'delivered', 
        deliveredAt: Timestamp.now() 
      });
      setActiveOrder(null);
    } catch (err) { alert("Upload error"); } finally { setUploadingImage(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-4">
          <h1 className="text-2xl font-black text-center mb-6">Rider Login</h1>
          <input required placeholder="Mobile" className="w-full p-5 bg-slate-50 rounded-2xl border ring-1 ring-slate-200" onChange={e => setLoginInput({...loginInput, number: e.target.value})} />
          <input required placeholder="Aadhar" className="w-full p-5 bg-slate-50 rounded-2xl border ring-1 ring-slate-200" onChange={e => setLoginInput({...loginInput, aadhar: e.target.value})} />
          <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Enter Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex overflow-hidden">
      <main className="flex-1 flex flex-col h-screen relative">
        <header className="bg-white p-4 border-b flex justify-between items-center">
          <Menu onClick={() => setIsSidebarOpen(true)} className="cursor-pointer" />
          <div className="flex items-center gap-2">
            <button onClick={() => setIsOnline(!isOnline)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${isOnline ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>{isOnline ? 'Online' : 'Offline'}</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-28">
          {activeTab === 'dashboard' && (
            <div className="max-w-md mx-auto space-y-6">
              {activeOrder ? (
                <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border-t-8 border-blue-600 animate-in zoom-in duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">NEW ORDER</span>
                      <p className="text-xs text-slate-400 mt-2 font-bold uppercase">ID: {activeOrder.orderId}</p>
                      <h2 className="text-5xl font-black mt-1 text-green-600">₹{(Number(activeOrder.deliveryFee || 0) * 0.8).toFixed(2)}</h2>
                      <p className="text-[10px] text-slate-400 font-bold italic mt-1">(Net Earning)</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-3xl mb-4 space-y-3">
                    <div className="flex gap-3"><MapPin className="text-red-500 shrink-0" size={18}/><p className="text-sm font-bold text-slate-700">{activeOrder.address}</p></div>
                    <div className="flex gap-3 border-t pt-3 border-slate-100"><User className="text-blue-500 shrink-0" size={18}/><p className="text-sm font-bold text-slate-700">{activeOrder.customerName}</p></div>
                  </div>

                  <div className="flex gap-3 mb-6">
                    <div className="bg-yellow-50 p-3 rounded-2xl flex-1 text-center font-black">
                      <p className="text-[10px] text-yellow-600">COLLECT CASH</p>
                      <p className="text-lg">₹{activeOrder.total}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl flex-1 text-center font-black">
                      <p className="text-[10px] text-blue-600">METHOD</p>
                      <p className="text-sm uppercase">{activeOrder.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <a href={`tel:${activeOrder.customer}`} className="bg-slate-900 text-white py-4 rounded-2xl flex justify-center items-center gap-2 font-black text-xs uppercase"><Phone size={16} /> Call</a>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.address)}`)} className="bg-blue-50 text-blue-600 py-4 rounded-2xl flex justify-center items-center gap-2 font-black text-xs uppercase"><Navigation size={16} /> Directions</button>
                  </div>

                  {["Preparing", "preparing", "assigned", "Out for Delivery", "out for delivery"].includes(activeOrder.status) && (
                    <button onClick={() => updateStatus('accepted')} className="w-full bg-green-500 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-green-100">ACCEPT ORDER</button>
                  )}
                  {activeOrder.status === 'accepted' && (
                    <button onClick={() => updateStatus('picked')} className="w-full bg-slate-800 text-white py-6 rounded-3xl font-black text-xl shadow-xl">ORDER PICKED</button>
                  )}
                  {activeOrder.status === 'picked' && (
                    <label className="w-full bg-green-600 text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 cursor-pointer">
                      <Camera size={24} /> {uploadingImage ? 'Saving...' : 'DELIVERED (UPLOAD PHOTO)'}
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-blue-100 p-8 rounded-full inline-block animate-pulse"><Bell className="text-blue-600" size={40} /></div>
                  <h3 className="font-black text-xl mt-6 text-slate-800">Waiting for Orders...</h3>
                  <p className="text-sm text-slate-400 px-10 mt-2">Make sure Admin assigns to: {riderData.number}</p>
                </div>
              )}
            </div>
          )}
          {/* EARNINGS & HISTORY (Same logic as before, strictly locked) */}
          {activeTab === 'earnings' && (
             <div className="max-w-md mx-auto bg-blue-600 p-8 rounded-[3rem] text-white shadow-2xl">
                <p className="text-blue-200 text-[10px] font-black uppercase">Net Earning (80%)</p>
                <h2 className="text-5xl font-black mt-2">₹{earnings.totalCut.toFixed(2)}</h2>
                <div className="mt-6 flex justify-between border-t border-blue-500 pt-4">
                  <div><p className="text-[10px] font-bold">Orders</p><p className="text-xl font-black">{earnings.totalOrders}</p></div>
                  <div className="text-right"><p className="text-[10px] font-bold">COD to Pay</p><p className="text-xl font-black">₹{earnings.codToDeposit}</p></div>
                </div>
             </div>
          )}
        </div>

        <nav className="fixed bottom-0 inset-x-0 bg-white border-t p-4 flex justify-around items-center z-30 pb-6 rounded-t-3xl shadow-2xl">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab==='dashboard' ? 'text-blue-600' : 'text-slate-300'}><PackageCheck size={28} /></button>
          <button onClick={() => setActiveTab('earnings')} className={activeTab==='earnings' ? 'text-blue-600' : 'text-slate-300'}><Wallet size={28} /></button>
        </nav>
      </main>
    </div>
  );
}

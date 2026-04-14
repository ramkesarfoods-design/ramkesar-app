"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from "@/firebase/config"; 
import { 
  doc, updateDoc, onSnapshot, collection, 
  query, where, getDocs, Timestamp, addDoc
} from "firebase/firestore";
import { 
  Bell, MapPin, Navigation, Phone, Wallet, History, 
  Power, Menu, X, User, LogOut, CheckCircle2,
  PackageCheck, Truck, MoreVertical, Calendar, 
  Banknote, TrendingUp, Clock, ChevronDown, ChevronUp, Home,
  PhoneCall, Settings, Calculator, MessageCircle, Send,
  Moon, Sun, Languages, Volume2
} from 'lucide-react';

export default function RiderPanel() {
  // --- CORE STATES (LOCKED) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [riderData, setRiderData] = useState<any>(null);
  const [loginInput, setLoginInput] = useState({ name: '', number: '', aadhar: '' });
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // --- UI STATES (LOCKED + NEW) ---
  const [activeMenu, setActiveMenu] = useState('live'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- NEW CUSTOM DATE STATE ---
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState('');
  
  // STATES FOR INLINE FORM & DROPDOWN (LOCKED + COD POPUP)
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completingFormId, setCompletingFormId] = useState<string | null>(null);
  const [codCollectId, setCodCollectId] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // --- SUCCESS POPUP STATE (LOCKED) ---
  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState("");

  // --- DATA STATES (LOCKED) ---
  const [activeOrders, setActiveOrders] = useState<any[]>([]); 
  const [allHistoryOrders, setAllHistoryOrders] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [riderEarning, setRiderEarning] = useState(0);
  const [adminCash, setAdminCash] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]); // NEW STATE FOR CLEARED NOTIFS
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notifLoadTime = useRef(Date.now()); // Tracking time to prevent alert on past notifications

  // --- NEW STATES FOR SUPPORT & SETTINGS ---
  const [appSettings, setAppSettings] = useState({
    language: 'English',
    theme: 'Light',
    bellSound: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
  });
  
  const [supportMessage, setSupportMessage] = useState("");
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [supportCategory, setSupportCategory] = useState("");
  const [supportOrderId, setSupportOrderId] = useState("");

  // --- EXACTLY 10 RINGTONES ---
  const bellSounds = [
    { name: "Fast Chime", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
    { name: "Alert Beep", url: "https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3" },
    { name: "Soft Notification", url: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3" },
    { name: "Urgent Ring", url: "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3" },
    { name: "Digital Tone", url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" },
    { name: "Classic Ring", url: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3" },
    { name: "Marimba Alert", url: "https://assets.mixkit.co/active_storage/sfx/2872/2872-preview.mp3" },
    { name: "Short Tap", url: "https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3" },
    { name: "Echo Ping", url: "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3" },
    { name: "Modern Synth", url: "https://assets.mixkit.co/active_storage/sfx/2875/2875-preview.mp3" }
  ];

  // --- AUTO LOGIN & INIT (LOCKED & UPDATED FOR NOTIFS) ---
  useEffect(() => {
    const savedRider = localStorage.getItem('riderSession');
    if (savedRider) {
      setRiderData(JSON.parse(savedRider));
      setIsLoggedIn(true);
    }
    const savedSettings = localStorage.getItem('riderSettings');
    if (savedSettings) {
      setAppSettings(JSON.parse(savedSettings));
    }
    const savedDismissed = localStorage.getItem('dismissedNotifs');
    if (savedDismissed) {
      setDismissedNotifs(JSON.parse(savedDismissed));
    }

    // Request Notification Permission for System Push
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

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
          const sessionData = { id: snap.docs[0].id, ...dbData };
          setRiderData(sessionData);
          await updateDoc(doc(db, "riders", snap.docs[0].id), { isOnline: true });
          setIsOnline(true);
          setIsLoggedIn(true);
          localStorage.setItem('riderSession', JSON.stringify(sessionData));
        } else { alert("Aadhar Mismatch!"); }
      }
    } catch (err) { alert("Login Error!"); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    if(riderData?.id) {
       await updateDoc(doc(db, "riders", riderData.id), { isOnline: false });
    }
    localStorage.removeItem('riderSession');
    window.location.reload();
  };

  // --- ONLINE/OFFLINE SYNC FIX (LOCKED) ---
  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    if (riderData?.id) {
      try {
        await updateDoc(doc(db, "riders", riderData.id), { isOnline: newStatus });
      } catch (err) {}
    }
  };

  // --- MASTER LISTENER (LOCKED) ---
  useEffect(() => {
    if (!isLoggedIn || !riderData || !isOnline) return;
    const qAllMyOrders = query(collection(db, "dispatch"), where("riderDetails.number", "==", riderData.number));
    const unsub = onSnapshot(qAllMyOrders, (snap) => {
      let active: any[] = [];
      let history: any[] = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        const orderStatus = String(data.status || "").toLowerCase();
        if (orderStatus === "delivered") {
          history.push({ id: doc.id, ...data });
        } else {
          active.push({ id: doc.id, ...data, status: data.status || "Preparing" }); 
        }
      });
      active.sort((a, b) => (a.dispatchedAt?.toMillis() || 0) - (b.dispatchedAt?.toMillis() || 0));
      history.sort((a, b) => (b.deliveredAt?.toMillis() || 0) - (a.deliveredAt?.toMillis() || 0));
      setActiveOrders(active);
      setAllHistoryOrders(history);

      if (active.some(o => ["preparing", "assigned", "out for delivery"].includes(String(o.status).toLowerCase()))) {
        playAlert();
      } else {
        stopAlert();
      }
    });
    return () => unsub();
  }, [isLoggedIn, isOnline, riderData, appSettings.bellSound]);

  // --- SUPPORT CHAT LISTENER (LOCKED) ---
  useEffect(() => {
    if (!isLoggedIn || !riderData || activeMenu !== 'support') return;
    const qChat = query(collection(db, "rider-support"), where("riderId", "==", riderData.id));
    const unsubChat = onSnapshot(qChat, (snap) => {
      let chats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      chats.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setSupportChats(chats);
    });
    return () => unsubChat();
  }, [isLoggedIn, riderData, activeMenu]);

  // --- UPDATED RIDER UPDATE (ADMIN NOTIFICATIONS) LISTENER ---
  useEffect(() => {
    if (!isLoggedIn || !riderData) return;
    const qUpdates = query(collection(db, "riderUpdate"));
    const unsubUpdates = onSnapshot(qUpdates, (snap) => {
      let notifs: any[] = [];
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        // Check target: "all" OR matching rider number
        if (data.target === "all" || data.target === riderData.number) {
           notifs.push({ id: doc.id, ...data });
        }
      });

      // Sort newest first
      notifs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setNotifications(notifs);

      // Handle sound & system push for strictly new updates
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const isTargetMatch = data.target === "all" || data.target === riderData.number;
          const isNew = (data.createdAt?.toMillis() || 0) > notifLoadTime.current;
          
          if (isTargetMatch && isNew) {
            // Play selected ringtone once
            const audio = new Audio(appSettings.bellSound);
            audio.play().catch(()=>{});

            // Show System/Mobile Notification
            if ("Notification" in window && Notification.permission === "granted") {
                const sysNotif = new Notification("RamKesar Rider", { body: data.message });
                sysNotif.onclick = () => {
                   window.focus();
                   setActiveMenu('notifications');
                };
            }
          }
        }
      });
    });
    return () => unsubUpdates();
  }, [isLoggedIn, riderData, appSettings.bellSound]);

  // Function to dismiss a specific notification
  const handleDismissNotification = (notifId: string) => {
    const updated = [...dismissedNotifs, notifId];
    setDismissedNotifs(updated);
    localStorage.setItem('dismissedNotifs', JSON.stringify(updated));
  };

  // Generate list of visible notifications
  const visibleNotifs = notifications.filter(n => !dismissedNotifs.includes(n.id));

  // --- UPGRADED FILTERS WITH CUSTOM DATE ---
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const filtered = allHistoryOrders.filter(order => {
      const orderDate = order.deliveredAt?.toDate() || order.dispatchedAt?.toDate() || new Date();
      if (dateFilter === 'today') return orderDate.toDateString() === todayStr;
      if (dateFilter === 'yesterday') return orderDate.toDateString() === yesterdayStr;
      if (dateFilter === 'week') return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (dateFilter === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      if (dateFilter === 'custom' && customDate) {
         return orderDate.toDateString() === new Date(customDate).toDateString();
      }
      return true;
    });

    let earningTemp = 0; let codTemp = 0;
    filtered.forEach(order => {
      const fee = Number(order.orderDetails?.deliveryFee || 0);
      const totalAmt = Number(order.orderDetails?.total || 0);
      const payMethod = String(order.orderDetails?.paymentMethod || "").toLowerCase();
      earningTemp += fee * 0.8; 
      if (payMethod === 'cod') codTemp += totalAmt; 
    });
    setFilteredHistory(filtered);
    setRiderEarning(earningTemp);
    setAdminCash(codTemp);
  }, [dateFilter, customDate, allHistoryOrders]);

  const playAlert = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    if (audioRef.current.src !== appSettings.bellSound) {
      audioRef.current.src = appSettings.bellSound;
    }
    audioRef.current.play().catch(() => {});
  };

  const stopAlert = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const saveSettings = (newSettings: any) => {
    setAppSettings(newSettings);
    localStorage.setItem('riderSettings', JSON.stringify(newSettings));
  };

  const handleSendSupportMessage = async () => {
    if (!supportMessage.trim()) return;
    try {
      await addDoc(collection(db, "rider-support"), {
        riderId: riderData.id,
        riderDetails: {
          name: riderData.name,
          number: riderData.number,
        },
        category: supportCategory,
        orderId: supportCategory === "Vehicle" ? "Vehicle Issue" : supportOrderId,
        message: supportMessage,
        sender: "Rider",
        createdAt: Timestamp.now()
      });
      setSupportMessage("");
    } catch (err) {
      alert("Message sending failed!");
    }
  };

  // --- DUAL DB SYNC (LOCKED) ---
  const updateStatus = async (dispatchDocId: string, actualOrderId: string, newStatus: string) => {
    stopAlert(); 
    await updateDoc(doc(db, "dispatch", dispatchDocId), { status: newStatus, updatedAt: Timestamp.now() });
    if (actualOrderId && actualOrderId !== "N/A") {
      try {
        const orderUpdateData: any = { status: newStatus };
        if (newStatus === 'accepted') {
          orderUpdateData.ridername = riderData.name;
          orderUpdateData.ridercall = riderData.number;
        }
        await updateDoc(doc(db, "orders", actualOrderId), orderUpdateData);
      } catch (err) {}
    }
  };

  // --- COMPLETE DELIVERY WITH SUCCESS POPUP (LOCKED) ---
  const handleCompleteDelivery = async (dispatchDocId: string, actualOrderId: string) => {
    if (!receiverName || receiverName.trim() === "") {
      alert("Receiver ka naam likhna zaroori hai!");
      return;
    }

    setCompletingId(dispatchDocId);
    try {
      await updateDoc(doc(db, "dispatch", dispatchDocId), { 
        status: 'delivered', 
        deliveredTo: receiverName,
        deliveredAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      if (actualOrderId && actualOrderId !== "N/A") {
        await updateDoc(doc(db, "orders", actualOrderId), { 
          status: 'delivered', 
          deliveredTo: receiverName 
        }).catch(() => {});
      }

      setDeliverySuccessMsg(`Order Delivered to ${receiverName}! 🎉`);
      setTimeout(() => {
        setDeliverySuccessMsg("");
      }, 3000);

      setCompletingFormId(null);
      setReceiverName("");
    } catch (err) {
      alert("Error updating status!");
    } finally {
      setCompletingId(null);
    }
  };

  // LANDMARK INCLUDED (LOCKED)
  const getDisplayData = (order: any) => {
    if (!order) return null;
    return {
      orderId: order.orderId || order.orderDetails?.id || "N/A",
      address: order.orderDetails?.address || "Address missing",
      landmark: order.orderDetails?.landmark || order.landmark || "",
      customerName: order.orderDetails?.customerName || "Customer",
      customerPhone: order.orderDetails?.customer || "",
      fee: Number(order.orderDetails?.deliveryFee || 0),
      total: Number(order.orderDetails?.total || 0),
      method: order.orderDetails?.paymentMethod || "COD",
      status: order.status || "Preparing",
      items: order.orderDetails?.items || order.orderDetails?.cart || order.items || []
    };
  };

  // CHECK IF CHAT SECTION CAN BE SHOWN
  const canShowChat = supportCategory === 'Vehicle' || 
    (['Order', 'Delivery', 'Customer'].includes(supportCategory) && supportOrderId !== "");

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${appSettings.theme === 'Dark' ? 'bg-slate-900' : 'bg-slate-100'} flex items-center justify-center p-6`}>
        <form onSubmit={handleLogin} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-4">
          <h1 className="text-2xl font-black text-center text-slate-800">Rider Access</h1>
          <input required placeholder="Mobile Number" className="w-full p-4 bg-slate-50 rounded-xl border font-bold" onChange={e => setLoginInput({...loginInput, number: e.target.value})} />
          <input required placeholder="Aadhar Number" className="w-full p-4 bg-slate-50 rounded-xl border font-bold" onChange={e => setLoginInput({...loginInput, aadhar: e.target.value})} />
          <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase">{loading ? 'Verifying...' : 'Login'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${appSettings.theme === 'Dark' ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'} flex flex-col relative`} onClick={() => { if(audioRef.current) audioRef.current.muted = false; }}>
      
      {/* SUCCESS POPUP OVERLAY (LOCKED) */}
      {deliverySuccessMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center animate-in zoom-in w-full max-w-xs transform transition-all">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-inner">
              <CheckCircle2 size={48} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 text-center uppercase tracking-wide">Awesome!</h3>
            <p className="text-base font-bold text-slate-500 text-center mt-2">{deliverySuccessMsg}</p>
          </div>
        </div>
      )}

      {/* --- UPGRADED 3-DOT MENU --- */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setIsMenuOpen(false)}></div>
          <div className={`w-72 h-full shadow-2xl flex flex-col animate-in slide-in-from-right ${appSettings.theme === 'Dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}>
              <span className="font-black text-blue-500">MENU</span>
              <X className="cursor-pointer text-slate-400" onClick={() => setIsMenuOpen(false)}/>
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              <button onClick={() => {setActiveMenu('live'); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold ${activeMenu==='live' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><PackageCheck size={20}/> Live Orders</button>
              <button onClick={() => {setActiveMenu('history'); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold ${activeMenu==='history' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><History size={20}/> Order History</button>
              <button onClick={() => {setActiveMenu('earnings'); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold ${activeMenu==='earnings' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Wallet size={20}/> My Earnings</button>
              <button onClick={() => {setActiveMenu('adminCash'); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold ${activeMenu==='adminCash' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Calculator size={20}/> Daily Deposit & Calc</button>
              <button onClick={() => {setActiveMenu('graphs'); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold ${activeMenu==='graphs' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><TrendingUp size={20}/> Performance</button>
              
              <div className={`border-t my-2 pt-2 ${appSettings.theme === 'Dark' ? 'border-slate-700' : ''}`}>
                 <button onClick={() => {setActiveMenu('support'); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold ${activeMenu==='support' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><PhoneCall size={20}/> Help & Support</button>
                 <button onClick={() => {setActiveMenu('settings'); setIsMenuOpen(false)}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold ${activeMenu==='settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Settings size={20}/> Settings</button>
              </div>
            </div>
            <div className={`p-4 border-t ${appSettings.theme === 'Dark' ? 'border-slate-700' : ''}`}><button onClick={handleLogout} className="w-full flex justify-center gap-2 p-4 rounded-xl font-bold text-red-500 bg-red-50"><LogOut size={20} /> Logout</button></div>
          </div>
        </div>
      )}

      {/* HEADER (UPDATED WITH GREEN DOT FOR VISIBLE NOTIFICATIONS) */}
      <header className={`p-4 flex justify-between items-center shadow-sm z-20 sticky top-0 ${appSettings.theme === 'Dark' ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex items-center gap-2"><Truck className="text-blue-500"/><h3 className="font-black text-sm uppercase">{activeMenu}</h3></div>
        <div className="flex items-center gap-4">
          <button onClick={toggleOnlineStatus} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${isOnline ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>{isOnline ? 'Online' : 'Offline'}</button>
          
          <div className="relative cursor-pointer" onClick={() => setActiveMenu('notifications')}>
             <Bell size={20} className={`${appSettings.theme === 'Dark' ? 'text-slate-300' : 'text-slate-600'} ${activeMenu === 'notifications' ? 'text-blue-500' : ''}`} />
             {visibleNotifs.length > 0 && (
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border border-white rounded-full animate-pulse shadow-sm"></span>
             )}
          </div>
          
          <MoreVertical className="cursor-pointer" onClick={() => setIsMenuOpen(true)}/>
        </div>
      </header>

      {/* MAIN CONTAINER (LOCKED) */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {activeMenu === 'live' && (
          <div className="max-w-md mx-auto space-y-6">
            {!isOnline ? (
               <div className={`text-center py-20 rounded-3xl border ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}><Power size={48} className="mx-auto text-slate-200 mb-4"/><p className="text-slate-400 font-bold uppercase italic">Go Online to receive orders</p></div>
            ) : activeOrders.length === 0 ? (
               <div className="text-center py-20"><div className="bg-blue-100 p-8 rounded-full inline-block animate-bounce"><Bell className="text-blue-600" size={40} /></div><h3 className="font-black text-xl mt-6">No Active Orders</h3></div>
            ) : (
               activeOrders.map((order, idx) => {
                 const disp = getDisplayData(order);
                 if (!disp) return null;
                 
                 const isUnaccepted = ["preparing", "assigned"].includes(String(disp.status).toLowerCase());

                 return (
                  <div key={order.id} className={`rounded-3xl p-5 shadow-lg border-t-8 transition-all duration-300 ${appSettings.theme === 'Dark' ? 'bg-slate-800' : 'bg-white'} ${isUnaccepted ? 'border-red-500 animate-pulse shadow-red-200' : 'border-blue-500'}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${isUnaccepted ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{disp.status}</span>
                        <div className="mt-2 space-y-0.5">
                           <p className="text-[10px] font-black text-slate-400 uppercase">ID: #{disp.orderId}</p>
                           <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/>{new Date(order.dispatchedAt?.toDate() || Date.now()).toLocaleTimeString()}</p>
                        </div>
                        <h2 className="text-4xl font-black mt-2 text-green-500">₹{(disp.fee * 0.8).toFixed(2)}</h2>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-2xl mb-4 space-y-3 ${appSettings.theme === 'Dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                      
                      <div className="flex gap-3">
                         <MapPin className="text-red-500 shrink-0" size={18}/>
                         <div>
                            <p className={`text-sm font-bold ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>{disp.address}</p>
                            {disp.landmark && <p className="text-xs text-slate-400 mt-1 uppercase font-bold">Landmark: {disp.landmark}</p>}
                         </div>
                      </div>

                      <div className="flex gap-3 border-t border-slate-200/20 pt-3"><User className="text-blue-500 shrink-0" size={18}/><p className={`text-sm font-bold ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>{disp.customerName}</p></div>
                      
                      <div className="border-t border-slate-200/20 pt-3">
                        <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="w-full flex items-center justify-between text-xs font-black text-slate-500 uppercase">
                          <span>View Order Items ({disp.items.length})</span>
                          {expandedOrder === order.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                        {expandedOrder === order.id && (
                          <div className={`mt-2 p-3 rounded-xl border space-y-1 ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                            {disp.items.length > 0 ? disp.items.map((it: any, i: number) => (
                              <div key={i} className={`flex justify-between text-xs font-bold ${appSettings.theme === 'Dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                <span>{it.qty} x {it.name}</span>
                              </div>
                            )) : <span className="text-xs text-slate-400">Items not found</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`p-3 rounded-2xl mb-4 text-center border font-black ${String(disp.method).toLowerCase() === 'cod' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                      <p className="text-[10px] uppercase">{disp.method}</p><p className="text-lg">₹{disp.total}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <a href={`tel:${disp.customerPhone}`} className={`py-3 rounded-xl flex justify-center gap-2 font-black text-xs uppercase ${appSettings.theme === 'Dark' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-800'}`}><Phone size={16} /> Call</a>
                      <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(disp.address)}`, '_blank')} className="bg-blue-50 text-blue-600 py-3 rounded-xl flex justify-center gap-2 font-black text-xs uppercase"><Navigation size={16} /> Map</button>
                    </div>

                    {isUnaccepted && (
                      <button onClick={() => updateStatus(order.id, disp.orderId, 'accepted')} className="w-full bg-green-500 text-white py-5 rounded-2xl font-black text-lg shadow-lg">ACCEPT ORDER</button>
                    )}
                    {disp.status === 'accepted' && (
                      <button onClick={() => updateStatus(order.id, disp.orderId, 'picked')} className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black text-lg shadow-lg">CONFIRM PICKUP</button>
                    )}
                    
                    {disp.status === 'picked' && (
                      <>
                        {codCollectId === order.id ? (
                           <div className={`w-full p-5 rounded-2xl border flex flex-col gap-3 items-center text-center shadow-lg animate-in zoom-in ${appSettings.theme === 'Dark' ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                             <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 mb-1"><Banknote size={32} /></div>
                             <h4 className={`font-black uppercase ${appSettings.theme === 'Dark' ? 'text-white' : 'text-slate-800'}`}>Collect Cash First</h4>
                             <p className="text-4xl font-black text-green-500">₹{disp.total}</p>
                             <div className="flex gap-2 w-full mt-4">
                               <button onClick={() => setCodCollectId(null)} className={`px-4 py-3 border rounded-xl font-bold text-xs uppercase w-1/3 ${appSettings.theme === 'Dark' ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-white text-slate-600 border-slate-300'}`}>Cancel</button>
                               <button onClick={() => { setCodCollectId(null); setCompletingFormId(order.id); }} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-black text-sm uppercase shadow-md flex justify-center items-center gap-2">
                                 <CheckCircle2 size={18}/> Collected
                               </button>
                             </div>
                           </div>
                        ) : completingFormId !== order.id ? (
                           <button onClick={() => {
                               if (String(disp.method).toLowerCase() === 'cod') {
                                   setCodCollectId(order.id);
                               } else {
                                   setCompletingFormId(order.id);
                               }
                           }} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">
                             <CheckCircle2 size={24} /> DELIVER COMPLETE
                           </button>
                        ) : (
                           <div className="w-full bg-blue-50 p-3 rounded-2xl border border-blue-200 flex flex-col gap-3 animate-in slide-in-from-bottom-2">
                             <input type="text" placeholder="Receiver Name (Kisko diya?)" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className={`w-full p-4 rounded-xl border border-blue-200 font-bold text-sm outline-none ${appSettings.theme === 'Dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`} />
                             <div className="flex gap-2">
                               <button onClick={() => setCompletingFormId(null)} className={`px-4 py-3 border rounded-xl font-bold text-xs uppercase ${appSettings.theme === 'Dark' ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-600 border-slate-300'}`}>Cancel</button>
                               <button onClick={() => handleCompleteDelivery(order.id, disp.orderId)} disabled={completingId === order.id} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-black text-sm uppercase shadow-md flex justify-center items-center gap-2">
                                 {completingId === order.id ? 'Saving...' : <><CheckCircle2 size={18}/> Submit & Complete</>}
                               </button>
                             </div>
                           </div>
                        )}
                      </>
                    )}
                  </div>
                 );
               })
            )}
          </div>
        )}

        {/* --- UPGRADED COMMON FILTERS (DATE & CUSTOM) --- */}
        {['history', 'earnings', 'adminCash'].includes(activeMenu) && (
          <div className="max-w-md mx-auto mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[ {id:'today', l:'Today'}, {id:'yesterday', l:'Yesterday'}, {id:'week', l:'7 Days'}, {id:'month', l:'Month'}, {id:'custom', l:'Custom Date'} ].map(f => (
                <button key={f.id} onClick={() => {setDateFilter(f.id); if(f.id !== 'custom') setCustomDate('');}} className={`px-4 py-2 whitespace-nowrap rounded-full text-xs font-black border transition-colors ${dateFilter === f.id ? 'bg-slate-800 text-white' : (appSettings.theme === 'Dark' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-600')}`}>{f.l}</button>
              ))}
            </div>
            {dateFilter === 'custom' && (
               <div className={`mt-2 p-3 rounded-xl border shadow-sm flex items-center gap-3 ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                 <Calendar className="text-blue-500" size={20}/>
                 <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="flex-1 bg-transparent font-bold text-slate-500 outline-none" />
               </div>
            )}
          </div>
        )}

        {/* --- ORDER HISTORY (LOCKED) --- */}
        {activeMenu === 'history' && (
          <div className="max-w-md mx-auto space-y-3 pb-10">
            {filteredHistory.map((h, i) => {
              const disp = getDisplayData(h);
              return (
                <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center shadow-sm ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                  <div className="w-2/3">
                    <p className="text-[10px] font-black text-slate-400 uppercase">#{disp?.orderId}</p>
                    <p className={`text-xs font-bold truncate ${appSettings.theme === 'Dark' ? 'text-slate-300' : 'text-slate-700'}`}>{disp?.address}</p>
                    <p className="text-[10px] font-bold text-blue-500 mt-1">Given to: {h.deliveredTo || 'Customer'}</p>
                  </div>
                  <div className="text-right font-black text-green-500 text-lg">₹{(disp!.fee * 0.8).toFixed(2)}</div>
                </div>
              );
            })}
            {filteredHistory.length === 0 && <p className="text-center text-slate-400 font-bold mt-10">No history found for selected date/filter.</p>}
          </div>
        )}

        {/* --- UPGRADED PROFILE TAB WITH IMAGE --- */}
        {activeMenu === 'profile' && (
           <div className={`max-w-md mx-auto mt-4 p-6 rounded-[2rem] border shadow-sm text-center relative overflow-hidden ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
             <div className="absolute top-0 left-0 w-full h-24 bg-blue-600 rounded-t-[2rem]"></div>
             
             {riderData?.riderPhotourl ? (
                <img src={riderData.riderPhotourl} alt="Rider Profile" className={`w-28 h-28 object-cover rounded-full mx-auto relative z-10 border-4 shadow-xl ${appSettings.theme === 'Dark' ? 'border-slate-800 bg-slate-800' : 'border-white bg-white'}`} />
             ) : (
                <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto relative z-10 border-4 shadow-xl ${appSettings.theme === 'Dark' ? 'bg-blue-900 border-slate-800' : 'bg-blue-100 border-white'}`}>
                   <User size={50} className="text-blue-500" />
                </div>
             )}
             
             <h2 className={`text-2xl font-black mt-4 capitalize ${appSettings.theme === 'Dark' ? 'text-white' : 'text-slate-800'}`}>{riderData?.name || "Rider Profile"}</h2>
             <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase mt-2 ${isOnline ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border'}`}>
                System Status: {isOnline ? 'Active Online' : 'Offline'}
             </span>
             
             <div className="mt-8 space-y-3 text-left">
               <div className={`p-4 rounded-xl border flex gap-4 items-center ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <Phone size={20} className="text-slate-400"/>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Registered Mobile</p><p className={`font-black ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>{riderData?.number || "N/A"}</p></div>
               </div>
               <div className={`p-4 rounded-xl border flex gap-4 items-center ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <Truck size={20} className="text-slate-400"/>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Number</p><p className={`font-black uppercase ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>{riderData?.vehicleNumber || "N/A"}</p></div>
               </div>
               <div className={`p-4 rounded-xl border flex gap-4 items-center ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <PackageCheck size={20} className="text-slate-400"/>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Rider System ID</p><p className={`font-black text-xs ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>{riderData?.id || "N/A"}</p></div>
               </div>
             </div>
           </div>
        )}

        {/* --- EARNINGS TAB (LOCKED) --- */}
        {activeMenu === 'earnings' && (
          <div className="max-w-md mx-auto mt-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
              <p className="text-[10px] font-black uppercase">My Net Earning</p>
              <h2 className="text-5xl font-black mt-2">₹{riderEarning.toFixed(2)}</h2>
              <div className="mt-8 border-t border-green-400 pt-4 flex gap-6">
                <div><p className="text-[10px] uppercase font-bold">Trips</p><p className="text-xl font-black">{filteredHistory.length}</p></div>
                <div><p className="text-[10px] uppercase font-bold">Filter</p><p className="text-sm font-black mt-1 capitalize">{dateFilter}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* --- UPGRADED ADMIN SETTLEMENT & DAILY DEPOSIT CALCULATION --- */}
        {activeMenu === 'adminCash' && (
          <div className="max-w-md mx-auto mt-4 space-y-4">
            <div className="bg-slate-800 p-8 rounded-[2rem] text-white shadow-xl">
              <p className="text-slate-300 text-[10px] font-black uppercase">Total COD Cash In Hand</p>
              <h2 className="text-5xl font-black mt-2 text-yellow-400">₹{adminCash.toFixed(2)}</h2>
            </div>
            
            <div className={`p-6 rounded-[2rem] border shadow-sm ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
               <div className="flex items-center gap-2 mb-6">
                 <Calculator className="text-blue-500"/>
                 <h4 className="font-black text-sm uppercase">Daily Deposit Calculation</h4>
               </div>
               
               <div className="space-y-4 text-sm">
                 <div className={`flex justify-between items-center p-3 rounded-xl ${appSettings.theme === 'Dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                   <span className="font-bold text-slate-500">Total COD Collected</span>
                   <span className={`font-black ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-800'}`}>₹{adminCash.toFixed(2)}</span>
                 </div>
                 
                 <div className={`flex justify-between items-center p-3 rounded-xl ${appSettings.theme === 'Dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
                   <span className="font-bold text-red-500">Minus Rider Earnings</span>
                   <span className="font-black text-red-500">- ₹{riderEarning.toFixed(2)}</span>
                 </div>
                 
                 <div className="border-t-2 border-dashed border-slate-200/20 pt-4 mt-2"></div>
                 
                 <div className={`flex justify-between items-center p-4 border rounded-xl ${appSettings.theme === 'Dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                   <div>
                     <span className="block text-[10px] font-black text-green-500 uppercase">To Deposit to Admin</span>
                     <span className="block text-2xl font-black text-green-600 mt-1">₹{Math.max(0, adminCash - riderEarning).toFixed(2)}</span>
                   </div>
                   <CheckCircle2 size={32} className="text-green-500 opacity-50"/>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* GRAPHS (LOCKED) */}
        {activeMenu === 'graphs' && (
          <div className={`max-w-md mx-auto mt-4 p-6 rounded-[2rem] border shadow-sm ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
             <h3 className={`font-black mb-6 uppercase ${appSettings.theme === 'Dark' ? 'text-white' : 'text-slate-800'}`}>Performance</h3>
             <div className="h-48 flex items-end justify-between gap-2 border-b border-slate-200/20 pb-2">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                   <div key={i} className="flex-1 bg-blue-500 rounded-t-lg transition-all" style={{height: `${h}%`}}></div>
                ))}
             </div>
             <p className="text-center text-[10px] font-black text-slate-400 mt-4 italic">LAST 7 DAYS ACTIVITY</p>
          </div>
        )}

        {/* --- UPDATED NOTIFICATIONS TAB --- */}
        {activeMenu === 'notifications' && (
           <div className={`max-w-md mx-auto mt-4 p-6 rounded-[2rem] border shadow-sm ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
             <h3 className={`font-black mb-6 uppercase flex items-center gap-2 ${appSettings.theme === 'Dark' ? 'text-white' : 'text-slate-800'}`}><Bell size={20}/> Updates & Alerts</h3>
             <div className="space-y-3">
                {visibleNotifs.length === 0 ? (
                   <div className={`p-4 rounded-xl border text-center text-sm font-bold ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      No new updates from Admin right now.
                   </div>
                ) : (
                   visibleNotifs.map((notif, i) => (
                      <div key={notif.id} className={`relative p-4 rounded-xl border text-sm font-bold pr-10 animate-in slide-in-from-right ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                         <button onClick={() => handleDismissNotification(notif.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <X size={14} />
                         </button>
                         {notif.title && <div className="text-xs text-blue-500 mb-1">{notif.title}</div>}
                         <div className="pr-2">{notif.message || notif.update}</div>
                         {notif.createdAt && <div className="text-[10px] text-slate-400 mt-2 font-normal text-right">{notif.createdAt.toDate().toLocaleString()}</div>}
                      </div>
                   ))
                )}
             </div>
           </div>
        )}

        {/* --- NEW HELP & SUPPORT --- */}
        {activeMenu === 'support' && (
          <div className="max-w-md mx-auto mt-4 space-y-4">
            <a href="tel:9873644504" className="w-full bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between hover:bg-blue-700 transition">
               <div>
                  <h3 className="text-xl font-black uppercase">Direct Call Admin</h3>
                  <p className="text-blue-200 text-sm font-bold mt-1">Emergency Support Line</p>
               </div>
               <div className="bg-white/20 p-4 rounded-full">
                  <PhoneCall size={32} />
               </div>
            </a>

            <div className={`p-6 rounded-[2rem] border shadow-sm flex flex-col h-[550px] ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-4">
                 <MessageCircle className="text-blue-500"/>
                 <h4 className="font-black text-sm uppercase">Live Chat Support</h4>
              </div>

              {/* STEP 1: SELECT CATEGORY */}
              <select 
                 className={`w-full p-3 rounded-xl border mb-3 font-bold text-sm outline-none ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                 value={supportCategory}
                 onChange={(e) => {
                    setSupportCategory(e.target.value);
                    setSupportOrderId(""); // Reset Order ID when category changes
                 }}
              >
                 <option value="">Select Query Type...</option>
                 <option value="Vehicle">Vehicle Issue</option>
                 <option value="Order">Order Issue</option>
                 <option value="Delivery">Delivery Issue</option>
                 <option value="Customer">Customer Issue</option>
              </select>

              {/* STEP 2: IF CATEGORY IS ORDER, DELIVERY, OR CUSTOMER, REQUIRE ORDER ID */}
              {['Order', 'Delivery', 'Customer'].includes(supportCategory) && (
                 <select 
                    className={`w-full p-3 rounded-xl border mb-4 font-bold text-sm outline-none ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                    value={supportOrderId}
                    onChange={(e) => setSupportOrderId(e.target.value)}
                 >
                    <option value="">Select Order ID...</option>
                    {activeOrders.map(o => (
                      <option key={o.id} value={o.orderId || o.id}>Active Order: #{o.orderId || o.id}</option>
                    ))}
                    {filteredHistory.slice(0, 5).map((o, i) => { // Showing recent 5 past orders
                      const disp = getDisplayData(o);
                      return <option key={`hist-${i}`} value={disp?.orderId}>Past Order: #{disp?.orderId}</option>;
                    })}
                 </select>
              )}

              {/* STEP 3: SHOW CHAT ONLY IF CONDITIONS ARE MET */}
              {canShowChat ? (
                <>
                  <div className={`flex-1 overflow-y-auto p-4 rounded-xl border space-y-3 mb-4 ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    {supportChats.length === 0 ? (
                       <p className="text-center text-slate-400 text-sm font-bold mt-10">No messages yet. Send a message to start chat.</p>
                    ) : (
                       supportChats.map((msg: any) => (
                         <div key={msg.id} className={`flex ${msg.sender?.toLowerCase() === 'rider' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-bold ${msg.sender?.toLowerCase() === 'rider' ? 'bg-blue-500 text-white rounded-tr-sm' : (appSettings.theme === 'Dark' ? 'bg-slate-700 text-white rounded-tl-sm' : 'bg-white border text-slate-800 rounded-tl-sm')}`}>
                               <p>{msg.message}</p>
                               <p className={`text-[9px] mt-1 text-right opacity-70`}>{msg.createdAt?.toDate().toLocaleTimeString()}</p>
                            </div>
                         </div>
                       ))
                    )}
                  </div>

                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       placeholder="Type issue here..." 
                       value={supportMessage}
                       onChange={(e) => setSupportMessage(e.target.value)}
                       className={`flex-1 p-3 rounded-xl border font-bold text-sm outline-none ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                     />
                     <button onClick={handleSendSupportMessage} className="bg-blue-600 text-white p-3 rounded-xl shadow-md">
                        <Send size={20} />
                     </button>
                  </div>
                </>
              ) : (
                 <div className="flex-1 flex items-center justify-center">
                    <p className="text-center text-slate-400 text-sm font-bold">Please select query type and order details to start chatting.</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* --- NEW SETTINGS --- */}
        {activeMenu === 'settings' && (
          <div className="max-w-md mx-auto mt-4 space-y-4">
             <div className={`p-6 rounded-[2rem] border shadow-sm ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <h3 className={`font-black mb-6 uppercase flex items-center gap-2 ${appSettings.theme === 'Dark' ? 'text-white' : 'text-slate-800'}`}><Settings size={20}/> App Settings</h3>
                
                <div className="space-y-6">
                   {/* Language */}
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${appSettings.theme === 'Dark' ? 'bg-slate-700' : 'bg-blue-50'}`}><Languages size={20} className="text-blue-500"/></div>
                         <div>
                            <p className={`font-black text-sm ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>Language</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">App Language</p>
                         </div>
                      </div>
                      <select 
                         value={appSettings.language}
                         onChange={(e) => saveSettings({...appSettings, language: e.target.value})}
                         className={`p-2 rounded-xl border font-bold text-xs outline-none ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                      >
                         <option value="English">English</option>
                         <option value="Hindi">Hindi (हिंदी)</option>
                      </select>
                   </div>

                   {/* Theme */}
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${appSettings.theme === 'Dark' ? 'bg-slate-700' : 'bg-blue-50'}`}>
                           {appSettings.theme === 'Dark' ? <Moon size={20} className="text-blue-500"/> : <Sun size={20} className="text-yellow-500"/>}
                         </div>
                         <div>
                            <p className={`font-black text-sm ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>Theme</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Dark / White Mode</p>
                         </div>
                      </div>
                      <select 
                         value={appSettings.theme}
                         onChange={(e) => saveSettings({...appSettings, theme: e.target.value})}
                         className={`p-2 rounded-xl border font-bold text-xs outline-none ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                      >
                         <option value="Light">White Mode</option>
                         <option value="Dark">Dark Mode</option>
                      </select>
                   </div>

                   {/* Notification Bell */}
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${appSettings.theme === 'Dark' ? 'bg-slate-700' : 'bg-blue-50'}`}><Volume2 size={20} className="text-blue-500"/></div>
                         <div>
                            <p className={`font-black text-sm ${appSettings.theme === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>Ringtone</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Alert Sound</p>
                         </div>
                      </div>
                      <select 
                         value={appSettings.bellSound}
                         onChange={(e) => {
                            saveSettings({...appSettings, bellSound: e.target.value});
                            const testAudio = new Audio(e.target.value);
                            testAudio.play().catch(()=>{});
                         }}
                         className={`w-32 p-2 rounded-xl border font-bold text-xs outline-none ${appSettings.theme === 'Dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                      >
                         {bellSounds.map((bell, i) => (
                           <option key={i} value={bell.url}>{bell.name}</option>
                         ))}
                      </select>
                   </div>
                </div>
             </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAVBAR (LOCKED) */}
      <nav className={`fixed bottom-0 w-full border-t flex justify-around p-3 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] ${appSettings.theme === 'Dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
         <button onClick={() => setActiveMenu('live')} className={`flex flex-col items-center gap-1 w-16 ${activeMenu === 'live' ? 'text-blue-500' : 'text-slate-400'}`}>
            <Home size={24} className={activeMenu === 'live' ? 'fill-blue-500/20' : ''} />
            <span className="text-[10px] font-black uppercase">Home</span>
         </button>
         <button onClick={() => setActiveMenu('history')} className={`flex flex-col items-center gap-1 w-16 ${activeMenu === 'history' ? 'text-blue-500' : 'text-slate-400'}`}>
            <History size={24} />
            <span className="text-[10px] font-black uppercase">History</span>
         </button>
         <button onClick={() => setActiveMenu('profile')} className={`flex flex-col items-center gap-1 w-16 ${activeMenu === 'profile' ? 'text-blue-500' : 'text-slate-400'}`}>
            <User size={24} className={activeMenu === 'profile' ? 'fill-blue-500/20' : ''} />
            <span className="text-[10px] font-black uppercase">Profile</span>
         </button>
      </nav>
    </div>
  );
}

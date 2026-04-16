"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { db } from "@/firebase/config";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, onSnapshot, query, orderBy, updateDoc, doc, limit,
  Timestamp, setDoc, addDoc
} from "firebase/firestore";
import { 
  UtensilsCrossed, Clock, CheckCircle2, Bike, 
  Bell, LogOut, Power, Volume2, VolumeX, Printer, AlertTriangle, Lock, ChefHat, Receipt, CheckSquare, Flame, Search, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Optimized sound loading
const alertSounds: any = {
  loudalarm1: 'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3',
  bell1: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
};

export default function RestaurantCounterPanel() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [storeStatus, setStoreStatus] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [processingOrders, setProcessingOrders] = useState<any>({});
  const [selectedRiders, setSelectedRiders] = useState<any>({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Quick Counter Filters & Search
  const [counterFilter, setCounterFilter] = useState("All");
  const [counterSearch, setCounterSearch] = useState("");

  const prevPendingCountRef = useRef(0);
  const PLATFORM_FEE = 5;

  // Authentication
  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // Fast Data Fetching
  useEffect(() => {
    if (!user) return; 

    const timer = setInterval(() => setCurrentTime(Date.now()), 10000); 

    const q = query(collection(db, "orders"), orderBy("createdAt", "asc"), limit(100)); 
    const unsubOrders = onSnapshot(q, (snap) => {
      const fetchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(fetchedOrders);
    });

    const unsubMenu = onSnapshot(collection(db, "menus"), (snap) => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubRiders = onSnapshot(collection(db, "riders"), (snap) => {
      setRiders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubStore = onSnapshot(doc(db, "storeStatus", "main"), (docSnap) => {
      if (docSnap.exists()) {
        setStoreStatus(docSnap.data().StoreOpen);
      }
    });

    return () => { unsubOrders(); unsubMenu(); unsubRiders(); unsubStore(); clearInterval(timer); };
  }, [user]);

  // ALL Live Orders (Used for Chef's Aggregate)
  const allLiveOrders = useMemo(() => {
      return orders.filter(o => ["Pending", "Confirmed", "Preparing", "Ready"].includes(o.status));
  }, [orders]);

  // FILTERED Live Orders (Used for Display List)
  const displayedOrders = useMemo(() => {
      return allLiveOrders.filter(o => {
          // 1. Tab Filter
          const matchesFilter = counterFilter === "All" ||
              (counterFilter === "Pending" && ["Pending", "Confirmed"].includes(o.status)) ||
              o.status === counterFilter;

          // 2. Search Filter
          const searchStr = counterSearch.toLowerCase();
          const custName = (typeof o.customer === 'object' ? o.customer.name : o.customerName || "").toLowerCase();
          const custPhone = (typeof o.customer === 'object' ? o.customer.phone : o.phone || "").toLowerCase();
          const orderId = o.id.toLowerCase();
          const matchesSearch = !searchStr || orderId.includes(searchStr) || custName.includes(searchStr) || custPhone.includes(searchStr);

          return matchesFilter && matchesSearch;
      });
  }, [allLiveOrders, counterFilter, counterSearch]);

  // CHEF'S AGGREGATE BATCH (Always uses allLiveOrders so nothing is missed)
  const chefAggregate = useMemo(() => {
      const map = new Map();
      allLiveOrders.forEach(o => {
          if (["Pending", "Confirmed", "Preparing"].includes(o.status)) {
              o.items?.forEach((i:any) => {
                  if(!map.has(i.name)) map.set(i.name, { name: i.name, qty: 0 });
                  map.get(i.name).qty += Number(i.qty);
              });
          }
      });
      return Array.from(map.values()).sort((a,b) => b.qty - a.qty);
  }, [allLiveOrders]);

  // Alert Ringtone Logic
  const livePendingOrders = useMemo(() => orders.filter(o => ["Pending", "Confirmed"].includes(o.status)), [orders]);
  useEffect(() => {
      if (livePendingOrders.length > prevPendingCountRef.current && soundEnabled) {
          const audio = new Audio(alertSounds.loudalarm1);
          audio.play().catch(e => console.log("Audio play blocked"));
      }
      prevPendingCountRef.current = livePendingOrders.length;
  }, [livePendingOrders.length, soundEnabled]);

  const toggleStoreStatus = async () => {
    const newStatus = !storeStatus;
    setStoreStatus(newStatus); 
    try {
      await setDoc(doc(db, "storeStatus", "main"), { StoreOpen: newStatus }, { merge: true });
    } catch (error) {
      setStoreStatus(!newStatus); 
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
    } catch (error) {
      alert("Invalid Access Credentials.");
    }
  };

  const handleRiderSelect = (orderId: string, riderId: string) => {
      setSelectedRiders((prev: any) => ({...prev, [orderId]: riderId}));
  };

  const updateStatus = async (orderId: string, newStatus: string, riderId?: string) => {
    setProcessingOrders((prev: any) => ({...prev, [orderId]: true}));
    try {
      const updateData: any = { status: newStatus, updatedAt: Timestamp.now() };
      if (riderId) updateData.assignedRider = riderId;
      await updateDoc(doc(db, "orders", orderId), updateData);

      // --- AUTO CUSTOMER NOTIFICATION ENGINE ---
      const fullOrder = orders.find(o => o.id === orderId);
      if (fullOrder && ["Preparing", "Out for Delivery", "Delivered"].includes(newStatus)) {
          const customerPhone = typeof fullOrder.customer === 'object' ? fullOrder.customer.phone : (fullOrder.phone || "N/A");
          
          if (customerPhone && customerPhone !== "N/A") {
              let msg = "";
              const shortId = orderId.slice(-5).toUpperCase();
              
              if (newStatus === "Preparing") {
                  msg = `Hello! Good news 🍳 Your Order #${shortId} has been accepted and is being prepared in our kitchen. Get ready for a delicious treat!`;
              } else if (newStatus === "Out for Delivery") {
                  msg = `Yay! 🚴‍♂️ Your Order #${shortId} is out for delivery. Our rider is on the way to bring your hot & fresh food to your doorstep!`;
              } else if (newStatus === "Delivered") {
                  msg = `Delivered! ✅ Your Order #${shortId} has been successfully delivered. Enjoy your meal and thank you for choosing RamKesar! ❤️`;
              }

              if (msg) {
                  await addDoc(collection(db, "clientUpdate"), {
                      target: customerPhone,
                      orderId: orderId,
                      message: msg,
                      createdAt: Timestamp.now(),
                      isRead: false,
                      status: 'unread'
                  });
              }
          }
      }
      // ----------------------------------------------

      if (newStatus === "Out for Delivery" && riderId) {
          const fullRider = riders.find(r => r.id === riderId);
          if (fullOrder && fullRider) {
              await addDoc(collection(db, "dispatch"), {
                  orderId: orderId,
                  riderId: riderId,
                  orderDetails: fullOrder,
                  riderDetails: fullRider,
                  dispatchedAt: Timestamp.now()
              });
          }
      }
    } catch (e) { 
        alert("Action Failed! Check Network."); 
    } finally {
        setProcessingOrders((prev: any) => ({...prev, [orderId]: false}));
    }
  };

  const acceptAndPrint = async (order: any) => {
      printBill(order);
      await updateStatus(order.id, "Preparing");
  };

  const printBill = (order: any) => {
    const itemsTotal = order.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0;
    const deliveryFee = Number(order.deliveryFee) || 0;
    const grandTotal = itemsTotal + PLATFORM_FEE + deliveryFee;
    
    const itemsHtml = order.items?.map((i:any) => `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
            <span>${i.qty}x ${i.name}</span>
            <span>Rs.${Number(i.price) * Number(i.qty)}</span>
        </div>
    `).join('');

    const customerName = typeof order.customer === 'object' ? order.customer.name : (order.customerName || "Customer");
    const customerAddress = order.address || (typeof order.customer === 'object' ? order.customer.address : "") || "N/A";
    const orderTime = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.now()).toLocaleString();
    
    const instructionsHtml = order.instructions ? `
        <div style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 12px; font-style: italic;">
            <strong>Instructions:</strong> ${order.instructions}
        </div>
    ` : '';

    const printContent = `
        <div style="font-family: monospace; width: 300px; margin: 0 auto; padding: 10px 15px;">
            <h2 style="text-align: center; margin: 0; font-size: 24px;">RAMKESAR</h2>
            <p style="text-align: center; margin: 5px 0 15px 0; font-size: 12px; font-weight: bold;">Swad Jo Dil Jeet Le</p>
            
            <div style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 12px;">
                <div style="margin-bottom: 3px;"><strong>Order ID:</strong> ${order.id}</div>
                <div style="margin-bottom: 3px;"><strong>Time:</strong> ${orderTime}</div>
                <div style="margin-bottom: 3px;"><strong>Name:</strong> ${customerName}</div>
                <div><strong>Address:</strong> ${customerAddress}</div>
            </div>
            
            <div style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">ORDER SUMMARY</div>
                ${itemsHtml}
            </div>
            
            ${instructionsHtml}
            
            <div style="font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span>Items Total</span><span>Rs.${itemsTotal}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span>Platform Fee</span><span>Rs.${PLATFORM_FEE}</span>
                </div>
                ${deliveryFee > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 3px;"><span>Delivery Fee</span><span>Rs.${deliveryFee}</span></div>` : ''}
                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; font-size: 16px; border-top: 1px solid #000; padding-top: 10px;">
                    <span>GRAND TOTAL</span><span>Rs.${grandTotal}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 11px; font-weight: bold;">
                <p>Thanks for visiting!<br/>Have a great meal.</p>
            </div>
        </div>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if(printWindow) {
        printWindow.document.write('<html><head><title>Print Bill</title></head><body>' + printContent + '</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { 
            printWindow.print(); 
            printWindow.close(); 
        }, 500);
    }
  };

  if (authLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black italic uppercase text-xs tracking-widest text-slate-500">Initializing Fast KDS...</p>
    </div>
  );

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-slate-900 font-sans">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-[3rem] shadow-2xl w-[400px] flex flex-col gap-6">
        <div className="text-center mb-4">
          <div className="w-20 h-20 bg-red-600 rounded-[2rem] rotate-3 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <ChefHat size={40} />
          </div>
          <h1 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">Counter POS</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Express Kitchen Display</p>
        </div>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Staff ID (Email)" required className="bg-slate-50 p-5 rounded-2xl text-[13px] font-bold outline-none border focus:border-red-100 text-slate-900" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="PIN / Password" required className="bg-slate-50 p-5 rounded-2xl text-[13px] font-bold outline-none border focus:border-red-100 text-slate-900" />
        <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-sm uppercase italic shadow-xl shadow-red-100 active:scale-95 transition-all mt-2">Access Counter</button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-100 overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                <ChefHat size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">RamKesar Counter</h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Kitchen Station</p>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-full mr-4 shadow-inner">
                <button onClick={() => setActiveTab('orders')} className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase italic transition-all ${activeTab === 'orders' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Live Screen</button>
                <button onClick={() => setActiveTab('menu')} className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase italic transition-all ${activeTab === 'menu' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Quick Menu</button>
            </div>

            <button onClick={toggleStoreStatus} className={`px-6 py-3 rounded-full font-black text-[11px] uppercase italic flex items-center gap-2 shadow-md transition-all ${storeStatus ? 'bg-green-500 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
                <Power size={14} /> Store {storeStatus ? 'Online' : 'Offline'}
            </button>

            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-full shadow-md transition-colors ${soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <button onClick={() => signOut(getAuth())} className="p-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-md">
                <LogOut size={18}/>
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex">
        <AnimatePresence mode="wait">
            
            {/* UNIFIED KDS SCREEN */}
            {activeTab === 'orders' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full h-full p-6 flex gap-6 overflow-hidden bg-slate-100">
                    
                    {/* LEFT: Live Order List */}
                    <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        
                        {/* Daily Use Filters & Search Bar */}
                        <div className="bg-slate-50 py-5 px-8 border-b border-slate-200 flex flex-col gap-4 shrink-0">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-black uppercase italic text-slate-900 flex items-center gap-2"><Receipt size={20}/> Live Order Stream</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input value={counterSearch} onChange={(e) => setCounterSearch(e.target.value)} placeholder="Find ID, Name, Phone..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:border-red-100 w-56 shadow-sm text-slate-700" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {['All', 'Pending', 'Preparing', 'Ready'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setCounterFilter(f)} 
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${counterFilter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        {f === 'Pending' ? 'New' : f === 'Preparing' ? 'Cooking' : f}
                                        <span className="ml-1 opacity-70">
                                            ({f === 'All' ? allLiveOrders.length : allLiveOrders.filter(o => f === 'Pending' ? ["Pending", "Confirmed"].includes(o.status) : o.status === f).length})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                            <div className="space-y-4">
                                {displayedOrders.map(order => {
                                    const orderMs = order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.now();
                                    const elapsedMins = Math.floor((currentTime - orderMs) / 60000);
                                    
                                    // Smart Timer Color
                                    let timerColor = 'text-green-600 bg-green-100';
                                    if(elapsedMins >= 15) timerColor = 'text-red-600 bg-red-100 animate-pulse';
                                    else if(elapsedMins >= 10) timerColor = 'text-orange-600 bg-orange-100';

                                    const isCOD = order.paymentMethod === 'COD' || !order.paymentMethod;

                                    return (
                                        <div key={order.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-6 hover:border-slate-300 transition-colors">
                                            
                                            {/* Timer & ID */}
                                            <div className="flex flex-col items-center justify-center shrink-0 w-24 border-r border-slate-100 pr-4">
                                                <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-widest flex items-center gap-1 ${timerColor}`}>
                                                    <Clock size={12}/> {elapsedMins}m
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">#{order.id.slice(-5)}</p>
                                            </div>

                                            {/* Customer & Items */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <p className="text-sm font-black text-slate-900 uppercase italic truncate">{typeof order.customer === 'object' ? order.customer.name : order.customerName}</p>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${isCOD ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{isCOD ? 'COD' : 'PAID'}</span>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ml-auto ${
                                                        ["Pending", "Confirmed"].includes(order.status) ? 'bg-red-50 text-red-500' :
                                                        order.status === 'Preparing' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
                                                    }`}>{order.status}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                    {order.items?.map((item:any, i:number) => (
                                                        <span key={i} className="text-xs font-bold text-slate-700 uppercase"><strong className="text-red-600">{item.qty}x</strong> {item.name}</span>
                                                    ))}
                                                </div>
                                                {order.instructions && (
                                                    <p className="mt-1 text-[10px] font-black text-red-500 italic bg-red-50 px-2 py-1 rounded inline-block">Note: {order.instructions}</p>
                                                )}
                                            </div>

                                            {/* Actions based on Status */}
                                            <div className="w-56 shrink-0 flex flex-col justify-center gap-2 pl-4 border-l border-slate-100">
                                                
                                                {["Pending", "Confirmed"].includes(order.status) && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { if(window.confirm("Reject this order?")) updateStatus(order.id, "Cancelled") }} disabled={processingOrders[order.id]} className="px-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50" title="Reject Order">
                                                            <X size={16}/>
                                                        </button>
                                                        <button onClick={() => acceptAndPrint(order)} disabled={processingOrders[order.id]} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase italic flex justify-center items-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-50">
                                                            <Printer size={14}/> {processingOrders[order.id] ? "Wait..." : "Accept & Print"}
                                                        </button>
                                                    </div>
                                                )}

                                                {order.status === "Preparing" && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => printBill(order)} className="px-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm" title="Reprint KOT">
                                                            <Printer size={16}/>
                                                        </button>
                                                        <button onClick={() => updateStatus(order.id, "Ready")} disabled={processingOrders[order.id]} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black text-[10px] uppercase italic flex justify-center items-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-50">
                                                            <CheckSquare size={14}/> {processingOrders[order.id] ? "Updating..." : "Mark Ready"}
                                                        </button>
                                                    </div>
                                                )}

                                                {order.status === "Ready" && (
                                                    <>
                                                        <select onChange={(e) => handleRiderSelect(order.id, e.target.value)} className="w-full bg-slate-50 p-2 rounded-lg text-[9px] font-bold uppercase italic outline-none border border-slate-200 text-slate-700 cursor-pointer">
                                                           <option value="">+ Assign Rider</option>
                                                           {riders.map(r => (
                                                               <option key={r.id} value={r.id} disabled={!r.isOnline}>
                                                                   {r.numericId || r.id.slice(-6)} - {r.name} {!r.isOnline ? '(Off)' : ''}
                                                               </option>
                                                           ))}
                                                        </select>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => printBill(order)} className="px-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all shadow-sm" title="Reprint Bill">
                                                                <Printer size={14}/>
                                                            </button>
                                                            <button 
                                                                disabled={!selectedRiders[order.id] || processingOrders[order.id]}
                                                                onClick={() => updateStatus(order.id, "Out for Delivery", selectedRiders[order.id])} 
                                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-black text-[10px] uppercase italic flex justify-center items-center gap-1 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:bg-slate-300"
                                                            >
                                                                <Bike size={12}/> Dispatch
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                        </div>
                                    )
                                })}
                                {displayedOrders.length === 0 && (
                                    <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                                        <UtensilsCrossed size={48} className="mb-4 opacity-50"/>
                                        <p className="text-xs font-black uppercase italic tracking-widest text-slate-400">Queue is Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Chef's Aggregate Batch Summary */}
                    <div className="w-80 shrink-0 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white">
                        <div className="bg-slate-800 py-5 px-6 flex justify-between items-center shrink-0">
                            <h2 className="text-sm font-black uppercase italic text-white flex items-center gap-2"><Flame size={16} className="text-orange-500"/> Chef's Summary</h2>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">Items to Cook (Aggregated)</p>
                            <div className="space-y-3">
                                {chefAggregate.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                        <span className="font-bold text-xs uppercase text-slate-200 truncate pr-2">{item.name}</span>
                                        <span className="font-black text-sm text-orange-400 bg-orange-500/10 px-3 py-1 rounded-lg">{item.qty}</span>
                                    </div>
                                ))}
                                {chefAggregate.length === 0 && (
                                    <p className="text-center text-slate-500 text-[10px] font-bold uppercase italic mt-10">Nothing to cook</p>
                                )}
                            </div>
                        </div>
                    </div>

                </motion.div>
            )}

            {/* QUICK MENU TOGGLE FOR KITCHEN STAFF */}
            {activeTab === 'menu' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full h-full p-8 overflow-y-auto bg-slate-100 custom-scrollbar">
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Kitchen Inventory</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Quickly mark items In/Out of stock</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl flex gap-6 border border-slate-100">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-[10px] font-black uppercase text-slate-500">Available</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-[10px] font-black uppercase text-slate-500">Out of Stock</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {menuItems.map(item => (
                                <div key={item.id} onClick={() => updateDoc(doc(db, "menus", item.id), { inStock: !item.inStock })} className={`p-5 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col items-center text-center group ${item.inStock ? 'bg-white border-slate-100 hover:border-green-200' : 'bg-red-50/50 border-red-100 opacity-75 grayscale-[50%]'}`}>
                                    <div className="w-20 h-20 rounded-full bg-slate-100 mb-4 overflow-hidden shadow-inner">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"/>
                                    </div>
                                    <h3 className="font-black text-sm uppercase italic text-slate-900 leading-tight mb-3 line-clamp-2">{item.name}</h3>
                                    
                                    <div className={`mt-auto w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors ${item.inStock ? 'bg-green-100 text-green-700 group-hover:bg-green-500 group-hover:text-white' : 'bg-red-500 text-white'}`}>
                                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
      </main>
    </div>
  );
}

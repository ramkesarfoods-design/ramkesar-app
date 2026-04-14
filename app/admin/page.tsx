"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { db } from "@/firebase/config";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, onSnapshot, query, orderBy, updateDoc, doc, 
  addDoc, deleteDoc, Timestamp, setDoc 
} from "firebase/firestore";
import { 
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Users, 
  TrendingUp, Clock, CheckCircle2, XCircle, Bike, 
  Search, Bell, LogOut, Plus, Edit3, Trash2, 
  Phone, Settings, Monitor, Power, Image as ImageIcon,
  Volume2, VolumeX, ChevronRight, Activity, ShieldCheck, Moon, Sun, AlertTriangle, Printer, FileText, Lock,
  BarChart3, History, PieChart, MessageSquare, Calendar, RefreshCw, Eye, Send, ClipboardList, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const alertSounds: any = {
  bell1: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  bell2: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  bell3: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  bell4: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  bell5: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
  trintrin: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3',
  loudalarm1: 'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3',
  loudalarm2: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3',
  loudalarm3: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3',
  loudalarm4: 'https://assets.mixkit.co/active_storage/sfx/1005/1005-preview.mp3',
};

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]); 
  const [supportChats, setSupportChats] = useState<any[]>([]); 
  const [reviews, setReviews] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [storeStatus, setStoreStatus] = useState(false);
  const [soundType, setSoundType] = useState("bell1"); 
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [orderFilter, setOrderFilter] = useState("Live");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("23:00");
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [selectedRiderDetails, setSelectedRiderDetails] = useState<any>(null);

  const [selectedRiders, setSelectedRiders] = useState<any>({});
  const [revealedPhones, setRevealedPhones] = useState<any>({});
  const [processingOrders, setProcessingOrders] = useState<any>({});
  
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [globalDateFilter, setGlobalDateFilter] = useState("Today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTargetType, setNotifyTargetType] = useState("all");
  const [notifyNumber, setNotifyNumber] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");

  const [showRiderNotifyModal, setShowRiderNotifyModal] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [activeSupportRider, setActiveSupportRider] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState("");
  const [historySearchId, setHistorySearchId] = useState("");
  const [viewOrderDetails, setViewOrderDetails] = useState<any>(null);

  const PLATFORM_FEE = 5;

  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return; 

    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (soundEnabled && fetchedOrders.length > orders.length && orders.length !== 0) {
        const audio = new Audio(alertSounds[soundType]);
        audio.play().catch(e => console.log("Audio play blocked"));
      }
      setOrders(fetchedOrders);
      setLoading(false);
    });
    const unsubMenu = onSnapshot(collection(db, "menus"), (snap) => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubRiders = onSnapshot(collection(db, "riders"), (snap) => {
      setRiders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAds = onSnapshot(collection(db, "ads"), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubDispatch = onSnapshot(collection(db, "dispatch"), (snap) => {
      setDispatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubReviews = onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const unsubSupport = onSnapshot(query(collection(db, "rider-support"), orderBy("createdAt", "asc")), (snap) => {
      const chats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      chats.forEach(c => {
         if(c.resolved && c.resolvedAt) {
             const resolvedTime = c.resolvedAt.seconds ? c.resolvedAt.seconds * 1000 : 0;
             if(Date.now() - resolvedTime > 15 * 60000) {
                 deleteDoc(doc(db, "rider-support", c.id)).catch(()=>console.log("Cleanup failed"));
             }
         }
      });
      setSupportChats(chats.filter(c => !c.resolved || (Date.now() - ((c.resolvedAt?.seconds || 0) * 1000) <= 15 * 60000)));
    });

    const unsubStore = onSnapshot(doc(db, "storeStatus", "main"), (docSnap) => {
      if (docSnap.exists()) {
        setStoreStatus(docSnap.data().StoreOpen);
      } else {
        setDoc(doc(db, "storeStatus", "main"), { StoreOpen: false }, { merge: true });
      }
    });

    return () => { unsub(); unsubMenu(); unsubRiders(); unsubAds(); unsubDispatch(); unsubReviews(); unsubSupport(); unsubStore(); clearInterval(timer); };
  }, [user, soundEnabled, soundType, orders.length]);

  useEffect(() => {
    if (!autoSchedule || !user) return;
    const interval = setInterval(async () => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [oH, oM] = openTime.split(':').map(Number);
        const openMinutes = oH * 60 + oM;
        const [cH, cM] = closeTime.split(':').map(Number);
        const closeMinutes = cH * 60 + cM;
        
        let shouldBeOpen = false;
        if (openMinutes < closeMinutes) {
            shouldBeOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        } else { 
            shouldBeOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
        }
        
        if (storeStatus !== shouldBeOpen) {
            try {
              await setDoc(doc(db, "storeStatus", "main"), { StoreOpen: shouldBeOpen }, { merge: true });
            } catch (error) {
              console.error("Auto-schedule update failed", error);
            }
        }
    }, 60000);
    return () => clearInterval(interval);
  }, [autoSchedule, openTime, closeTime, storeStatus, user]);

  const unreadSupportCount = supportChats.filter(c => !c.resolved && c.sender === 'rider').length;
  const supportMsgCount = supportChats.length;
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
      if (supportMsgCount > prevMsgCountRef.current && soundEnabled) {
          const latestChat = supportChats[supportChats.length - 1];
          if (latestChat && latestChat.sender === 'rider') {
              const audio = new Audio(alertSounds[soundType]);
              audio.play().catch(e => console.log("Audio play blocked"));
          }
      }
      prevMsgCountRef.current = supportMsgCount;
  }, [supportMsgCount, supportChats, soundEnabled, soundType]);

  const handleManualSync = () => {
      setIsSyncing(true);
      setCurrentTime(Date.now()); 
      setTimeout(() => setIsSyncing(false), 1500);
  };

  const toggleStoreStatus = async () => {
    const newStatus = !storeStatus;
    setStoreStatus(newStatus); 
    try {
      await setDoc(doc(db, "storeStatus", "main"), { StoreOpen: newStatus }, { merge: true });
    } catch (error) {
      console.error("Failed to sync store status", error);
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

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
    } catch (error) {
      console.error(error);
    }
  };

  const isDateInRange = (timestampMs: number) => {
      if(globalDateFilter === 'All Time') return true;
      const d = new Date(timestampMs);
      d.setHours(0,0,0,0);
      const today = new Date(); today.setHours(0,0,0,0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

      if(globalDateFilter === 'Today') return d.getTime() === today.getTime();
      if(globalDateFilter === 'Yesterday') return d.getTime() === yesterday.getTime();
      if(globalDateFilter === 'Custom') {
           if(!customStartDate || !customEndDate) return true;
           const s = new Date(customStartDate); s.setHours(0,0,0,0);
           const e = new Date(customEndDate); e.setHours(23,59,59,999);
           return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
      }
      return true;
  };

  const dateFilteredOrders = useMemo(() => {
      return orders.filter(o => {
          const orderTimestampMs = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : Date.now();
          const matchesDate = isDateInRange(orderTimestampMs);
          const matchesSearch = historySearchId ? o.id.toLowerCase().includes(historySearchId.toLowerCase()) : true;
          return matchesDate && matchesSearch;
      });
  }, [orders, globalDateFilter, customStartDate, customEndDate, historySearchId]);

  const dateFilteredReviews = useMemo(() => {
      return reviews.filter(r => {
          const reviewTimeMs = r.createdAt?.seconds ? r.createdAt.seconds * 1000 : Date.now();
          return isDateInRange(reviewTimeMs);
      });
  }, [reviews, globalDateFilter, customStartDate, customEndDate]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const validOrders = orders.filter(o => !["Cancelled", "Rejected"].includes(o.status));
    const todayOrders = validOrders.filter(o => {
        const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();
        return date.toDateString() === today;
    });

    const calculateGrandTotal = (order: any) => {
        if (Number(order.totalAmount)) return Number(order.totalAmount);
        const itemsTotal = order.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0;
        return itemsTotal + PLATFORM_FEE + (Number(order.deliveryFee) || 0);
    };

    return {
      revenue: validOrders.reduce((sum, o) => sum + calculateGrandTotal(o), 0),
      todayRevenue: todayOrders.reduce((sum, o) => sum + calculateGrandTotal(o), 0),
      active: orders.filter(o => ["Pending", "Confirmed", "Preparing", "Out for Delivery"].includes(o.status)).length,
      deliveredToday: todayOrders.filter(o => o.status === "Delivered").length,
      chartData: orders.slice(0, 7).reverse().map(o => ({
        time: o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Now",
        amount: calculateGrandTotal(o)
      }))
    };
  }, [orders]);

  const itemSalesData = useMemo(() => {
      const map = new Map();
      dateFilteredOrders.forEach(o => {
          if(["Cancelled", "Rejected"].includes(o.status)) return;
          o.items?.forEach((i: any) => {
              if(!map.has(i.name)) map.set(i.name, { name: i.name, qty: 0, revenue: 0 });
              const item = map.get(i.name);
              item.qty += Number(i.qty);
              
              const menuItem = menuItems.find(m => m.name === i.name);
              const basePrice = menuItem ? Number(menuItem.price) : Number(i.price);
              const discountVal = menuItem ? Number(menuItem.discount || 0) : Number(i.discount || 0);
              const actualPrice = basePrice - (basePrice * discountVal / 100);
              
              item.revenue += (actualPrice * Number(i.qty));
          });
      });
      return Array.from(map.values()).sort((a,b) => b.qty - a.qty);
  }, [dateFilteredOrders, menuItems]);

  const salesReportData = useMemo(() => {
      let totalItemsGross = 0;
      let totalPlatformFee = 0;
      let totalDeliveryFee = 0;
      let completedOrders = 0;

      dateFilteredOrders.forEach(o => {
          if(o.status !== 'Delivered') return;
          completedOrders++;
          const itemsTotal = o.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0;
          totalItemsGross += itemsTotal;
          totalPlatformFee += PLATFORM_FEE;
          totalDeliveryFee += (Number(o.deliveryFee) || 0);
      });

      const grossRevenue = totalItemsGross + totalPlatformFee + totalDeliveryFee;
      return { grossRevenue, totalItemsGross, totalPlatformFee, totalDeliveryFee, completedOrders };
  }, [dateFilteredOrders]);

  const customerData = useMemo(() => {
      const map = new Map();
      orders.forEach(o => {
          if(["Cancelled", "Rejected"].includes(o.status)) return;
          const phone = typeof o.customer === 'object' ? o.customer.phone : (o.phone || o.customer);
          const name = typeof o.customer === 'object' ? o.customer.name : o.customerName;
          if(!phone || phone === "No Number") return;
          
          const itemsTotal = o.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0;
          const grandTotal = itemsTotal + PLATFORM_FEE + (Number(o.deliveryFee) || 0);
          const orderTime = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : Date.now();

          if(!map.has(phone)){
              map.set(phone, { name: name || 'Valued Customer', phone, totalOrders: 0, totalSpend: 0, activeFrom: orderTime });
          }
          const c = map.get(phone);
          c.totalOrders += 1;
          c.totalSpend += grandTotal;
          if(orderTime < c.activeFrom) c.activeFrom = orderTime;
      });
      return Array.from(map.values()).sort((a,b) => b.totalSpend - a.totalSpend);
  }, [orders]);

  const dispatchLedgerData = useMemo(() => {
      const map = new Map();
      dispatches.forEach(d => {
          const dispatchTimeMs = d.dispatchedAt?.seconds ? d.dispatchedAt.seconds * 1000 : Date.now();
          if (!isDateInRange(dispatchTimeMs)) return;

          const riderId = d.riderId;
          const rName = d.riderDetails?.name || "Unknown Rider";
          const rNumId = d.riderDetails?.numericId || d.riderDetails?.id?.slice(-6) || "---";

          const order = d.orderDetails || {};
          const deliveryFee = Number(order.deliveryFee) || 0;
          const itemsTotal = order.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0;
          const grandTotal = Number(order.totalAmount) || (itemsTotal + PLATFORM_FEE + deliveryFee);
          
          const isCOD = !order.paymentMethod || order.paymentMethod.toUpperCase() === 'COD';
          
          if(!map.has(riderId)) {
              map.set(riderId, { name: rName, numericId: rNumId, totalOrders: 0, earnings: 0, cashCollected: 0 });
          }
          
          const ledger = map.get(riderId);
          ledger.totalOrders += 1;
          ledger.earnings += (deliveryFee * 0.8);
          if(isCOD) {
              ledger.cashCollected += grandTotal;
          }
      });
      return Array.from(map.values()).sort((a,b) => b.totalOrders - a.totalOrders);
  }, [dispatches, globalDateFilter, customStartDate, customEndDate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const isLive = ["Pending", "Confirmed", "Preparing", "Out for Delivery"].includes(o.status);
      const matchesFilter = 
        orderFilter === "All" ? true : 
        orderFilter === "Live" ? isLive : 
        o.status === orderFilter;

      const customerStr = typeof o.customer === 'object' ? `${o.customer.name} ${o.customer.phone}` : (o.customer || "");
      const matchesSearch = (o.id || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (o.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customerStr.includes(searchTerm);
      return matchesFilter && matchesSearch;
    });
  }, [orders, orderFilter, searchTerm]);

  const updateStatus = async (orderId: string, newStatus: string, riderId?: string) => {
    setProcessingOrders((prev: any) => ({...prev, [orderId]: true}));
    try {
      const updateData: any = { status: newStatus, updatedAt: Timestamp.now() };
      if (riderId) updateData.assignedRider = riderId;
      await updateDoc(doc(db, "orders", orderId), updateData);

      if (newStatus === "Out for Delivery" && riderId) {
          const fullOrder = orders.find(o => o.id === orderId);
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
        alert("Update Failed!"); 
    } finally {
        setProcessingOrders((prev: any) => ({...prev, [orderId]: false}));
    }
  };

  const handleRiderSelect = (orderId: string, riderId: string) => {
      setSelectedRiders((prev: any) => ({...prev, [orderId]: riderId}));
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

  const renderDateFilter = () => (
      <div className="flex gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6 items-center flex-wrap">
          <Calendar size={18} className="text-slate-400 ml-2" />
          <div className="flex gap-2">
              {['Today', 'Yesterday', 'All Time', 'Custom'].map(f => (
                  <button key={f} onClick={() => setGlobalDateFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${globalDateFilter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                      {f}
                  </button>
              ))}
          </div>
          {globalDateFilter === 'Custom' && (
              <div className="flex items-center gap-2 ml-4">
                  <input type="date" value={customStartDate} onChange={e=>setCustomStartDate(e.target.value)} className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-600 outline-none"/>
                  <span className="text-slate-300 text-xs">-</span>
                  <input type="date" value={customEndDate} onChange={e=>setCustomEndDate(e.target.value)} className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-600 outline-none"/>
              </div>
          )}
          {activeTab === 'order-history' && (
              <div className="ml-auto relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input value={historySearchId} onChange={e=>setHistorySearchId(e.target.value)} placeholder="Search Order ID" className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-red-100 w-48"/>
              </div>
          )}
      </div>
  );

  if (authLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black italic uppercase text-[10px] tracking-widest text-slate-500">Checking Security Clearance...</p>
    </div>
  );

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-slate-900 font-sans">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-[3rem] shadow-2xl w-[400px] flex flex-col gap-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-600 rounded-2xl rotate-3 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <Lock size={30} />
          </div>
          <h1 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">RamKesar</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Authorized Access Only</p>
        </div>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin Email" required className="bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required className="bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" />
        <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase italic shadow-xl shadow-red-100 active:scale-95 transition-all mt-2">Unlock Terminal</button>
      </form>
    </div>
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black italic uppercase text-[10px] tracking-widest text-slate-400">Loading RamKesar Engine...</p>
    </div>
  );

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        .dark { background-color: #0f172a !important; color: #f8fafc !important; }
        .dark .bg-white { background-color: #1e293b !important; border-color: #334155 !important; }
        .dark .bg-slate-50, .dark .bg-slate-100 { background-color: #0f172a !important; border-color: #1e293b !important; color: #f8fafc !important; }
        .dark .text-slate-900 { color: #f8fafc !important; }
        .dark .text-slate-600, .dark .text-slate-700 { color: #cbd5e1 !important; }
        .dark .border-slate-100, .dark .border-slate-200 { border-color: #334155 !important; }
      `}</style>

      <aside className="w-72 bg-slate-100 border-r border-slate-200 flex flex-col shrink-0 z-50 inner-content">
        <div className="p-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl rotate-3 flex items-center justify-center text-white shadow-lg">
                  <UtensilsCrossed size={20} />
              </div>
              <h1 className="text-2xl font-black italic text-slate-900 tracking-tighter uppercase">RamKesar</h1>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors"><LogOut size={16}/></button>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-1">Terminal Admin</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-10">
          {[
            { id: "dashboard", label: "Overview", icon: LayoutDashboard },
            { id: "orders", label: "Order Desk", icon: ShoppingCart, badge: stats.active },
            { id: "menu", label: "Menu Editor", icon: UtensilsCrossed },
            { id: "riders", label: "Fleet Mgmt", icon: Bike },
            { id: "dispatch", label: "Dispatch Desk", icon: ClipboardList },
            { id: "item-sales", label: "Item Sales", icon: BarChart3 },
            { id: "order-history", label: "Order History", icon: History },
            { id: "sales-report", label: "Sales Report", icon: PieChart },
            { id: "customers", label: "Customers", icon: Users },
            { id: "reviews", label: "Reviews", icon: Star },
            { id: "ads", label: "Ads & Promo", icon: ImageIcon },
            { id: "settings", label: "System", icon: Settings },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.5rem] text-[11px] font-black transition-all group ${activeTab === item.id ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"}`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={18} className={activeTab === item.id ? "text-red-500" : ""} /> 
                <span className="uppercase italic tracking-tighter">{item.label}</span>
              </div>
              {item.badge ? <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="p-6 shrink-0">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
                <button onClick={toggleStoreStatus} className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase italic transition-all ${storeStatus ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}>
                    <Power size={14} /> Store {storeStatus ? 'Online' : 'Offline'}
                </button>
                {autoSchedule && <p className="text-center text-[8px] font-bold text-slate-400 mt-2 uppercase">Auto-Schedule Active</p>}
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative inner-content">
        
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{activeTab.replace('-', ' ')}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toDateString()}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Records..." 
                className="w-80 pl-12 pr-6 py-3 bg-slate-50 rounded-2xl outline-none text-[11px] font-bold border focus:border-red-100 transition-all text-slate-900" />
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 bg-slate-50 border border-slate-100 rounded-full text-slate-600 hover:text-red-500 transition-colors">
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-red-500" />}
                </button>
                <div className="text-right ml-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase italic">Today Revenue</p>
                   <p className="text-lg font-black text-red-600 italic">₹{stats.todayRevenue}</p>
                </div>
                <div className="h-10 w-px bg-slate-100"></div>
                
                <div className="flex items-center gap-2">
                    <button onClick={handleManualSync} className={`p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-all ${isSyncing ? 'animate-spin text-blue-500' : ''}`} title="Manual Sync">
                        <RefreshCw size={14}/>
                    </button>
                    <button onClick={() => setShowSupportModal(true)} className="p-2 bg-slate-100 text-slate-500 rounded-full relative hover:bg-slate-200 transition-all" title="Rider Support">
                        <Bell size={14}/>
                        {unreadSupportCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>}
                    </button>
                </div>

                <div className="flex items-center gap-3 bg-slate-900 text-white p-1.5 pr-5 rounded-full ml-2">
                    <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center font-black italic uppercase">RK</div>
                    <span className="text-[10px] font-black uppercase italic">Owner</span>
                </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {activeTab === "dashboard" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="dash" className="space-y-10">
                <div className="grid grid-cols-4 gap-6">
                  {[
                    { label: "Today Revenue", val: `₹${stats.todayRevenue}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Active Orders", val: stats.active, icon: ShoppingCart, color: "text-red-600", bg: "bg-red-50" },
                    { label: "Delivered", val: stats.deliveredToday, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Riders", val: riders.length, icon: Bike, color: "text-purple-600", bg: "bg-purple-50" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                      <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">{s.label}</p><p className="text-2xl font-black italic text-slate-900">{s.val}</p></div>
                      <div className={`w-14 h-14 rounded-3xl ${s.bg} ${s.color} flex items-center justify-center`}><s.icon size={26} /></div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-[400px]">
                        <h3 className="text-sm font-black italic text-slate-900 uppercase mb-8">Live Sales Tracker</h3>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={stats.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="amount" stroke="#EF4444" strokeWidth={4} dot={{ r: 4, fill: "#EF4444" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-slate-900 rounded-[3rem] p-8">
                         <h3 className="text-white text-sm font-black italic uppercase mb-6 flex items-center gap-2"><Activity size={18} className="text-red-500"/> Recent Logs</h3>
                         <div className="space-y-4">
                            {orders.slice(0, 5).map((order, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-white italic uppercase">Order #{order.id.slice(-5)}</p>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">{order.status}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-700" />
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
              </motion.div>
            )}

            {activeTab === "orders" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="orders" className="space-y-8">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {["All", "Live", "Pending", "Preparing", "Out for Delivery", "Delivered"].map(f => (
                    <button key={f} onClick={() => setOrderFilter(f)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic border ${orderFilter === f ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-100" : "bg-white text-slate-400 border-slate-100"}`}>{f}</button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-8">
                  {filteredOrders.map(order => {
                    const itemsTotal = order.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0;
                    const deliveryFee = Number(order.deliveryFee) || 0;
                    const calculatedGrandTotal = itemsTotal + PLATFORM_FEE + deliveryFee;
                    const phoneNo = typeof order.customer === 'object' ? order.customer.phone : (order.customer || order.phone || "No Number");
                    
                    const orderTimestampMs = order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.now();
                    const isDelayed = ["Pending", "Confirmed"].includes(order.status) && (currentTime - orderTimestampMs > 600000);

                    return (
                    <div key={order.id} className={`bg-white rounded-[2.5rem] border ${isDelayed ? 'border-red-400 shadow-red-100' : 'border-slate-100 shadow-sm'} p-7 flex flex-col group relative overflow-hidden transition-all`}>
                      
                      {isDelayed && (
                        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[8px] font-black uppercase italic text-center py-1 flex items-center justify-center gap-1">
                          <AlertTriangle size={10} /> Action Required: Delayed {'>'} 10m
                        </div>
                      )}

                      <div className={`flex justify-between items-start mb-6 ${isDelayed ? 'mt-3' : ''}`}>
                        <div className="flex flex-col gap-1 w-2/3">
                            <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-widest break-words leading-tight">ID: {order.id}</span>
                            <span className="text-[8px] font-bold text-slate-400">{new Date(orderTimestampMs).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</span>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <span className="text-[9px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase italic shrink-0">{order.paymentMethod || 'COD'}</span>
                            <button onClick={() => printBill(order)} className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase flex items-center gap-1 hover:bg-slate-700 transition-all"><Printer size={10}/> Print</button>
                        </div>
                      </div>
                      
                      <h3 className="font-black italic uppercase text-xs text-slate-900 mb-1">
                          {typeof order.customer === 'object' ? order.customer.name : (order.customerName || "Customer")}
                      </h3>
                      
                      <button 
                        onClick={() => setRevealedPhones({...revealedPhones, [order.id]: true})}
                        className="text-[9px] font-bold text-slate-500 mb-6 flex items-center gap-1.5 uppercase bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all w-fit border border-slate-100"
                      >
                          <Phone size={12} className="text-red-500"/> 
                          {revealedPhones[order.id] ? phoneNo : "Click to View Number"}
                      </button>
                      
                      <div className="bg-slate-50 p-5 rounded-3xl mb-6">
                         <div className="space-y-3 mb-3">
                            {order.items?.map((item:any, i:number) => (
                            <div key={i} className="flex justify-between text-[11px] font-black italic text-slate-700 uppercase">
                                <span className="w-2/3 truncate pr-2">{item.qty}x {item.name}</span>
                                <span>₹{Number(item.price) * Number(item.qty)}</span>
                            </div>
                            ))}
                         </div>
                         <div className="pt-3 border-t border-dashed border-slate-200 text-[10px] font-black space-y-1.5">
                            <div className="flex justify-between text-slate-400"><span>Items Total</span><span>₹{itemsTotal}</span></div>
                            <div className="flex justify-between text-slate-400"><span>Platform Fee</span><span>₹{PLATFORM_FEE}</span></div>
                            <div className="flex justify-between text-slate-400"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
                            <div className="flex justify-between text-red-600 text-[13px] uppercase italic mt-2 border-t border-slate-200 pt-2">
                                <span>Grand Total</span>
                                <span>₹{calculatedGrandTotal}</span>
                            </div>
                         </div>
                      </div>

                      <div className="mt-auto space-y-2">
                        {["Pending", "Confirmed"].includes(order.status) && (
                            <div className="flex gap-2 items-center">
                                <button onClick={() => updateStatus(order.id, "Cancelled")} className="px-3 bg-red-50 text-red-500 py-3 rounded-2xl text-[9px] font-black uppercase italic border border-red-100 hover:bg-red-100 transition-all">Reject</button>
                                <button 
                                    disabled={processingOrders[order.id]}
                                    onClick={() => updateStatus(order.id, "Preparing")} 
                                    className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase italic shadow-lg active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {processingOrders[order.id] ? "Processing..." : "Accept & Prepare"}
                                </button>
                            </div>
                        )}
                        
                        {order.status === "Preparing" && (
                            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <select onChange={(e) => handleRiderSelect(order.id, e.target.value)} className="w-full bg-white p-3 rounded-xl text-[10px] font-black uppercase italic outline-none border focus:border-red-100 text-slate-600 cursor-pointer">
                                   <option value="">+ Assign Rider</option>
                                   {riders.map(r => (
                                       <option key={r.id} value={r.id} disabled={!r.isOnline}>
                                           {r.name} ({r.vehicleNumber || 'No Vehicle'}) {!r.isOnline ? '- Offline' : ''}
                                       </option>
                                   ))}
                                </select>
                                <button 
                                    disabled={!selectedRiders[order.id] || processingOrders[order.id]}
                                    onClick={() => updateStatus(order.id, "Out for Delivery", selectedRiders[order.id])} 
                                    className="w-full bg-orange-500 text-white py-3 rounded-xl text-[10px] font-black uppercase italic shadow-md disabled:opacity-50"
                                >
                                    {processingOrders[order.id] ? "Dispatching..." : "Handover & Dispatch"}
                                </button>
                            </div>
                        )}
                        
                        {order.status === "Out for Delivery" && (
                            <div className="w-full bg-slate-100 text-slate-500 py-3.5 rounded-2xl text-[10px] font-black uppercase italic text-center border border-slate-200 flex items-center justify-center gap-2">
                                <Bike size={14} /> Rider Control (Awaiting Delivery)
                            </div>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </motion.div>
            )}

            {/* DISPATCH DESK TAB */}
            {activeTab === "dispatch" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="dispatch" className="space-y-6">
                    {renderDateFilter()}
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                        <h3 className="font-black italic uppercase text-lg text-slate-900 tracking-tighter mb-8">Rider Dispatch Ledger</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rider Details</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Orders Delivered</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Earnings (80% Fee)</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Cash Collected (COD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dispatchLedgerData.map((row: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-4">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ID: {row.numericId}</p>
                                                <p className="font-black text-sm uppercase italic text-slate-900">{row.name}</p>
                                            </td>
                                            <td className="py-4 text-center font-bold text-sm text-slate-700">{row.totalOrders}</td>
                                            <td className="py-4 text-center font-black italic text-green-600">₹{row.earnings.toFixed(2)}</td>
                                            <td className="py-4 text-right font-black italic text-orange-600 text-lg">₹{row.cashCollected.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {dispatchLedgerData.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Dispatch Records Found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === "item-sales" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="item-sales" className="space-y-6">
                    {renderDateFilter()}
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                        <h3 className="font-black italic uppercase text-lg text-slate-900 tracking-tighter mb-8">Item Sales Performance</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dish Name</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Qty Sold</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Revenue Generated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemSalesData.length > 0 ? itemSalesData.map((item: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 font-black text-xs uppercase italic text-slate-900">{item.name}</td>
                                            <td className="py-4 text-center font-bold text-sm text-slate-700">{item.qty}</td>
                                            <td className="py-4 text-right font-black italic text-green-600">₹{item.revenue.toFixed(2)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Sales Found for this period</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === "order-history" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="order-history" className="space-y-6">
                    {renderDateFilter()}
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                        <h3 className="font-black italic uppercase text-lg text-slate-900 tracking-tighter mb-8">Order History Logs</h3>
                        <div className="space-y-4">
                            {dateFilteredOrders.map((order: any) => {
                                const itemsTotal = order.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0;
                                const gTotal = itemsTotal + PLATFORM_FEE + (Number(order.deliveryFee) || 0);
                                const dateStr = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.now()).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'});
                                return(
                                <div key={order.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-md transition-all">
                                    <div className="flex gap-6 items-center">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-[10px] uppercase shadow-inner ${order.status === 'Delivered' ? 'bg-green-100 text-green-600' : order.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {order.status.substring(0,3)}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase italic text-slate-900">{typeof order.customer === 'object' ? order.customer.name : (order.customerName || "Customer")}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {order.id} • {dateStr}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-lg font-black italic text-slate-900">₹{gTotal}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{order.items?.length || 0} Items</p>
                                        </div>
                                        <button onClick={() => setViewOrderDetails(order)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-500 transition-all"><Eye size={18}/></button>
                                    </div>
                                </div>
                            )})}
                            {dateFilteredOrders.length === 0 && <p className="text-center py-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Orders Found</p>}
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === "sales-report" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="sales-report" className="space-y-6">
                    {renderDateFilter()}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total Gross Sales</p>
                            <p className="text-3xl font-black italic text-slate-900">₹{salesReportData.grossRevenue}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Platform Fees Collected</p>
                            <p className="text-3xl font-black italic text-blue-600">₹{salesReportData.totalPlatformFee}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Rider Fees (Collected)</p>
                            <p className="text-3xl font-black italic text-orange-500">₹{salesReportData.totalDeliveryFee}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Completed Orders</p>
                            <p className="text-3xl font-black italic text-green-600">{salesReportData.completedOrders}</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 p-10 rounded-[3rem] shadow-xl text-white">
                        <h3 className="font-black italic uppercase text-lg text-white tracking-tighter mb-8 flex items-center gap-3"><PieChart size={20} className="text-red-500"/> Financial Breakdown</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between py-4 border-b border-slate-700">
                                <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Total Food Value (Gross)</span>
                                <span className="font-black italic text-lg">₹{salesReportData.totalItemsGross}</span>
                            </div>
                            <div className="flex justify-between py-4 border-b border-slate-700">
                                <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Platform Convenience Charges</span>
                                <span className="font-black italic text-lg text-blue-400">+ ₹{salesReportData.totalPlatformFee}</span>
                            </div>
                            <div className="flex justify-between py-4 border-b border-slate-700">
                                <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Delivery Charges (Customer Paid)</span>
                                <span className="font-black italic text-lg text-orange-400">+ ₹{salesReportData.totalDeliveryFee}</span>
                            </div>
                            <div className="flex justify-between py-6 mt-4 bg-slate-800 px-6 rounded-2xl">
                                <span className="font-black text-sm uppercase tracking-widest text-white">Net Total Revenue</span>
                                <span className="font-black italic text-2xl text-green-400">₹{salesReportData.grossRevenue}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === "customers" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="customers" className="space-y-6">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Customer CRM</h2>
                        <button onClick={() => setShowNotifyModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black text-[11px] uppercase italic flex items-center gap-3 shadow-xl shadow-blue-100"><MessageSquare size={18}/> Send Update</button>
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Profile</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Total Orders</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Active From</th>
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Lifetime Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerData.map((c: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-4">
                                                <p className="font-black text-xs uppercase italic text-slate-900">{c.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1">{c.phone}</p>
                                            </td>
                                            <td className="py-4 text-center font-bold text-sm text-slate-700">{c.totalOrders}</td>
                                            <td className="py-4 text-center font-bold text-[10px] text-slate-500 uppercase">{new Date(c.activeFrom).toLocaleDateString()}</td>
                                            <td className="py-4 text-right font-black italic text-green-600 text-lg">₹{c.totalSpend}</td>
                                        </tr>
                                    ))}
                                    {customerData.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Customers Found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* NEW REVIEWS TAB */}
            {activeTab === "reviews" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="reviews" className="space-y-6">
                    {renderDateFilter()}
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                        <h3 className="font-black italic uppercase text-lg text-slate-900 tracking-tighter mb-8">Customer Reviews</h3>
                        <div className="grid grid-cols-2 gap-6">
                            {dateFilteredReviews.map((rev) => (
                                <div key={rev.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                                        <div>
                                            <p className="font-black uppercase italic text-sm text-slate-900">{rev.customerName || "Valued Customer"}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Order: #{rev.orderId?.slice(-5) || "N/A"}</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                                            {rev.createdAt?.seconds ? new Date(rev.createdAt.seconds * 1000).toLocaleDateString('en-IN', {dateStyle:'medium'}) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Food Quality</span>
                                            <span className="text-sm font-black text-orange-500">⭐ {rev.foodRating || 0}/5</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Rider: {rev.ridername || "N/A"}</span>
                                            <span className="text-sm font-black text-orange-500">⭐ {rev.riderRating || 0}/5</span>
                                        </div>
                                        {rev.comment && (
                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                <p className="text-[11px] font-bold text-slate-600 italic">"{rev.comment}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {dateFilteredReviews.length === 0 && (
                                <div className="col-span-2 text-center py-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    No Reviews Found For This Period
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === "menu" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Kitchen Menu</h2>
                    <button onClick={() => {setEditingItem(null); setShowItemModal(true);}} className="bg-red-600 text-white px-8 py-4 rounded-3xl font-black text-[11px] uppercase italic flex items-center gap-3 shadow-xl shadow-red-100"><Plus size={18}/> Add Dish</button>
                </div>
                <div className="grid grid-cols-4 gap-8">
                   {menuItems.map(item => {
                     const discountVal = Number(item.discount) || 0;
                     const actualPrice = item.price - (item.price * discountVal / 100);
                     return(
                     <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-5 shadow-sm group">
                        <div className="h-44 bg-slate-100 rounded-3xl mb-5 overflow-hidden relative">
                           <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                           <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${item.inStock ? 'bg-green-500' : 'bg-slate-300'}`} />
                           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-black uppercase italic text-slate-900 shadow-sm">⭐ {item.rating || '4.5'}</div>
                        </div>
                        <h3 className="font-black italic text-sm uppercase truncate text-slate-900">{item.name}</h3>
                        <p className="text-[9px] text-slate-400 mt-1 truncate">{item.description || 'No description'}</p>
                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-50">
                           <div>
                             <p className="text-xl font-black text-red-600 italic leading-none">₹{actualPrice.toFixed(0)}</p>
                             {discountVal > 0 && <p className="text-[9px] font-bold text-slate-400 line-through mt-1">₹{item.price}</p>}
                           </div>
                           <div className="flex gap-3 items-center">
                             <button onClick={() => {setEditingItem(item); setShowItemModal(true);}} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={16}/></button>
                             <button 
                               onClick={() => updateDoc(doc(db, "menus", item.id), { inStock: !item.inStock })} 
                               className={`w-10 h-5 rounded-full relative transition-all shadow-inner border border-slate-200 flex-shrink-0 ${item.inStock ? 'bg-green-500' : 'bg-slate-200'}`}
                             >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${item.inStock ? 'right-0.5' : 'left-0.5'}`} />
                             </button>
                           </div>
                        </div>
                     </div>
                   )})}
                </div>
              </motion.div>
            )}

            {activeTab === "riders" && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Delivery Fleet</h2>
                        <div className="flex gap-4">
                            <button onClick={() => setShowRiderNotifyModal(true)} className="bg-blue-600 text-white px-6 py-4 rounded-3xl font-black text-[11px] uppercase italic flex items-center gap-3 shadow-xl shadow-blue-100"><MessageSquare size={18}/> Send Update</button>
                            <button onClick={() => setShowRiderModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-[11px] uppercase italic flex items-center gap-3 shadow-xl"><Plus size={18}/> Add Rider</button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-10">
                        <div className="col-span-2 grid grid-cols-2 gap-6 auto-rows-max">
                            {riders.map(r => (
                                <div key={r.id} onClick={() => setSelectedRiderDetails(r)} className={`bg-white p-6 rounded-[2.5rem] border ${selectedRiderDetails?.id === r.id ? 'border-red-500 shadow-md ring-4 ring-red-50' : 'border-slate-100 shadow-sm'} flex items-start gap-4 cursor-pointer hover:border-red-200 transition-all group`}>
                                    <div className="relative shrink-0">
                                      <div className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-all overflow-hidden">
                                          {r.riderPhotourl ? <img src={r.riderPhotourl} alt={r.name} className="w-full h-full object-cover" /> : <Bike size={24}/>}
                                      </div>
                                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${r.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID: {r.numericId || r.id.slice(-6)}</p>
                                        <p className="font-black italic uppercase text-sm text-slate-900 truncate w-full pr-2">{r.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 truncate">{r.number}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          <span className="text-[8px] font-black text-slate-500 uppercase bg-slate-50 px-2 py-1 rounded-md border border-slate-200">Aadhar: {r.aadhar}</span>
                                          <span className="text-[8px] font-black text-slate-500 uppercase bg-slate-50 px-2 py-1 rounded-md border border-slate-200">{r.vehicleNumber}</span>
                                        </div>
                                    </div>
                                    <button onClick={(e) => {
                                        e.stopPropagation(); 
                                        const confirmId = window.prompt(`Enter Rider Numeric ID (${r.numericId || r.id.slice(-6)}) to confirm deletion:`);
                                        if (confirmId === (r.numericId || r.id.slice(-6))) {
                                            deleteDoc(doc(db, "riders", r.id)); 
                                            if(selectedRiderDetails?.id === r.id) setSelectedRiderDetails(null);
                                        } else if (confirmId !== null) {
                                            alert("Incorrect ID. Deletion cancelled.");
                                        }
                                    }} className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all self-start mt-1 shrink-0"><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-slate-50 p-8 rounded-[3.5rem] border border-slate-100 shadow-inner h-fit">
                            {selectedRiderDetails ? (
                                <div className="space-y-6">
                                    <h3 className="font-black italic uppercase text-lg text-slate-900 tracking-tighter border-b border-slate-200 pb-4">Rider Metrics</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${selectedRiderDetails.isOnline ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>{selectedRiderDetails.isOnline ? 'Online' : 'Offline'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase">Active From</span>
                                          <span className="text-xs font-black text-slate-900">{selectedRiderDetails.createdAt?.seconds ? new Date(selectedRiderDetails.createdAt.seconds * 1000).toLocaleDateString('en-IN', {dateStyle:'medium'}) : 'N/A'}</span>
                                        </div>
                                        
                                        {(() => {
                                            const riderDispatches = dispatches.filter(d => 
                                                d.riderDetails?.number === selectedRiderDetails.number || 
                                                d.riderId === selectedRiderDetails.id
                                            );
                                            const totalDeliveryFee = riderDispatches.reduce((sum, d) => sum + (Number(d.orderDetails?.deliveryFee) || 0), 0);
                                            const riderEarning = totalDeliveryFee * 0.80; 

                                            return (
                                                <>
                                                <div className="flex justify-between items-center">
                                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Delivered</span>
                                                  <span className="text-lg font-black text-blue-600">{riderDispatches.length}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-slate-200 pt-4 mt-2">
                                                  <span className="text-[10px] font-black text-slate-900 uppercase">Net Earnings (80% Share)</span>
                                                  <span className="text-2xl font-black text-green-600 italic">₹{riderEarning.toFixed(2)}</span>
                                                </div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
                                    <Bike size={48} className="opacity-20" />
                                    <p className="text-[10px] font-black uppercase italic tracking-widest text-center">Select a rider to<br/>view metrics</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "ads" && (
                <div className="space-y-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black italic uppercase text-slate-900">Banners & Promotions</h2>
                        <button onClick={() => setShowAdModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase italic flex items-center gap-3"><Plus size={18}/> Push Banner</button>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                        {ads.map(ad => (
                            <div key={ad.id} className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden group">
                                <div className="aspect-[16/7] bg-slate-100">
                                    <img src={ad.image} alt={ad.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-slate-600 italic tracking-[0.1em]">{ad.name || 'Ad Campaign'}</span>
                                    <button onClick={() => deleteDoc(doc(db, "ads", ad.id))} className="text-red-500 font-black text-[10px] uppercase italic flex items-center gap-1 hover:underline"><Trash2 size={14}/> Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "settings" && (
                <div className="max-w-2xl bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm mx-auto">
                    <h2 className="text-2xl font-black italic uppercase mb-10 text-center tracking-tighter text-slate-900">System Terminal Settings</h2>
                    <div className="space-y-6">
                        
                        <div className="flex items-center justify-between p-7 bg-slate-50 rounded-[2.5rem]">
                            <div><p className="font-black italic uppercase text-sm text-slate-900">Store Visibility</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Manual Override Status</p></div>
                            <button onClick={toggleStoreStatus} className={`w-14 h-7 rounded-full relative transition-all ${storeStatus ? 'bg-green-500' : 'bg-red-500'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${storeStatus ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="p-7 bg-slate-50 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center justify-between">
                                <div><p className="font-black italic uppercase text-sm text-slate-900">Auto Scheduling</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Automate store open/close</p></div>
                                <button onClick={() => setAutoSchedule(!autoSchedule)} className={`w-14 h-7 rounded-full relative transition-all ${autoSchedule ? 'bg-slate-900' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${autoSchedule ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            {autoSchedule && (
                                <div className="flex gap-4 pt-4 border-t border-slate-200">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Opening Time</label>
                                        <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="w-full mt-1 bg-white p-3 rounded-xl text-[10px] font-black border border-slate-200 outline-none text-slate-900"/>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Closing Time</label>
                                        <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="w-full mt-1 bg-white p-3 rounded-xl text-[10px] font-black border border-slate-200 outline-none text-slate-900"/>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-7 bg-slate-50 rounded-[2.5rem]">
                            <div><p className="font-black italic uppercase text-sm text-slate-900">Alert Bell Logic</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Choose notification sound</p></div>
                            <select 
                              value={soundType} 
                              onChange={(e)=>setSoundType(e.target.value)} 
                              className="bg-white p-3 rounded-xl text-[10px] font-black uppercase italic outline-none border border-slate-200 text-slate-900 cursor-pointer"
                            >
                                <option value="bell1">Standard Chime</option>
                                <option value="bell2">Digital Ping</option>
                                <option value="bell3">Classic Bell</option>
                                <option value="bell4">Soft Notification</option>
                                <option value="bell5">Alert Tone</option>
                                <option value="trintrin">Trin Trin</option>
                                <option value="loudalarm1">Zomato Loud 1</option>
                                <option value="loudalarm2">Zomato Loud 2</option>
                                <option value="loudalarm3">Zomato Loud 3</option>
                                <option value="loudalarm4">Zomato Loud 4</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center justify-between p-7 bg-slate-50 rounded-[2.5rem]">
                            <div>
                              <p className="font-black italic uppercase text-sm text-slate-900">Dashboard Theme</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Toggle dark mode environment</p>
                            </div>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-7 rounded-full relative transition-all ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-5 h-5 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'right-1 bg-slate-900 text-white' : 'left-1 bg-white text-yellow-500'}`}>
                                    {isDarkMode ? <Moon size={12} /> : <Sun size={12} />}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* DISH EDITOR MODAL */}
      <AnimatePresence>
        {showItemModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white p-10 rounded-[3rem] w-[500px] shadow-2xl relative border border-slate-100">
                    <button onClick={() => setShowItemModal(false)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><XCircle size={24} /></button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-8">{editingItem ? "Update Recipe" : "Add New Dish"}</h2>
                    
                    <form onSubmit={async (e: any) => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const data: any = {
                          ...Object.fromEntries(fd.entries()),
                          price: Number(fd.get("price")),
                          discount: Number(fd.get("discount")),
                          inStock: editingItem ? editingItem.inStock : true
                        };
                        
                        try {
                          if (editingItem) {
                              await updateDoc(doc(db, "menus", editingItem.id), data);
                          } else {
                              await addDoc(collection(db, "menus"), data);
                          }
                          setShowItemModal(false);
                        } catch (error) {
                          alert("Failed to sync menu item.");
                        }
                    }} className="space-y-4">
                        <input name="name" defaultValue={editingItem?.name} placeholder="Dish Name" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        <input name="description" defaultValue={editingItem?.description} placeholder="Short Description" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <input name="prepTime" defaultValue={editingItem?.prepTime} placeholder="Prep Time (mins)" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                            <input name="image" defaultValue={editingItem?.image} placeholder="Image URL" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input name="price" type="number" defaultValue={editingItem?.price} placeholder="Base Price (₹)" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                            <input name="discount" type="number" defaultValue={editingItem?.discount || 0} placeholder="Discount (%)" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" />
                        </div>
                        
                        <input name="rating" defaultValue={editingItem?.rating || "4.5"} placeholder="Initial Rating Display" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" />
                        <button className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase italic shadow-xl shadow-red-100 active:scale-95 transition-all mt-4">{editingItem ? "Push Update" : "Deploy to Menu"}</button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* RIDER ONBOARDING MODAL */}
      <AnimatePresence>
        {showRiderModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white p-10 rounded-[3rem] w-[500px] shadow-2xl relative border border-slate-100">
                    <button onClick={() => setShowRiderModal(false)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><XCircle size={24} /></button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-8">Rider Onboarding</h2>
                    
                    <form onSubmit={async (e:any) => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const newRider = {
                          name: fd.get("name"),
                          number: fd.get("number"),
                          aadhar: fd.get("aadhar"),
                          vehicleNumber: fd.get("vehicleNumber"),
                          riderPhotourl: fd.get("riderPhotourl"),
                          numericId: Math.floor(100000 + Math.random() * 900000).toString(),
                          createdAt: Timestamp.now(),
                          status: "Active",
                          isOnline: false 
                        };
                        await addDoc(collection(db, "riders"), newRider);
                        setShowRiderModal(false);
                    }} className="space-y-4">
                        <input name="name" placeholder="Full Name" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        <input name="number" placeholder="Mobile Number" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        <div className="grid grid-cols-2 gap-4">
                            <input name="aadhar" placeholder="Aadhar Number" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                            <input name="vehicleNumber" placeholder="Vehicle Reg No." className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        </div>
                        <input name="riderPhotourl" placeholder="Rider Photo URL" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        <button className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase italic shadow-2xl active:scale-95 transition-all mt-4">Verify & Approve</button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* AD CAMPAIGN MODAL */}
      <AnimatePresence>
        {showAdModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white p-10 rounded-[3rem] w-[500px] shadow-2xl relative border border-slate-100">
                    <button onClick={() => setShowAdModal(false)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"><XCircle size={24} /></button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-8">Deploy Banner</h2>
                    
                    <form onSubmit={async (e: any) => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        try {
                          await addDoc(collection(db, "ads"), { image: fd.get("image"), name: fd.get("name") });
                          setShowAdModal(false);
                        } catch (error) {
                          alert("Failed to push campaign.");
                        }
                    }} className="space-y-4">
                        <input name="name" placeholder="Campaign Name" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        <input name="image" placeholder="Marketing Asset URL (Image)" className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" required />
                        <p className="text-[9px] font-bold text-slate-400 italic px-2">Optimal delivery resolution: 16:7 aspect ratio.</p>
                        <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase italic shadow-xl active:scale-95 transition-all mt-4">Push Campaign Live</button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOMER NOTIFICATION MODAL */}
      <AnimatePresence>
        {showNotifyModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white p-10 rounded-[3rem] w-[500px] shadow-2xl relative border border-slate-100">
                    <button onClick={() => setShowNotifyModal(false)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><XCircle size={24} /></button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-8">Push Update</h2>
                    
                    <form onSubmit={async (e: any) => {
                        e.preventDefault();
                        if(!notifyMessage.trim()) return alert("Message cannot be empty");
                        
                        try {
                          await addDoc(collection(db, "clientUpdate"), { 
                              target: notifyTargetType === 'all' ? 'all' : notifyNumber,
                              message: notifyMessage,
                              createdAt: Timestamp.now(),
                              isRead: false,
                              status: 'unread'
                          });
                          setShowNotifyModal(false);
                          setNotifyMessage("");
                          setNotifyNumber("");
                          alert("Update Pushed Successfully!");
                        } catch (error) {
                          alert("Failed to push update.");
                        }
                    }} className="space-y-4">
                        <select 
                            value={notifyTargetType} 
                            onChange={(e) => setNotifyTargetType(e.target.value)} 
                            className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-100 text-slate-900 cursor-pointer"
                        >
                            <option value="all">Broadcast to All Customers</option>
                            <option value="specific">Target Specific Number</option>
                        </select>
                        
                        {notifyTargetType === 'specific' && (
                            <input 
                                value={notifyNumber} 
                                onChange={(e)=>setNotifyNumber(e.target.value)} 
                                placeholder="Customer Phone (+91...)" 
                                className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-100 text-slate-900" 
                                required 
                            />
                        )}

                        <textarea 
                            value={notifyMessage}
                            onChange={(e)=>setNotifyMessage(e.target.value)}
                            placeholder="Type your notification message here..." 
                            className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-100 text-slate-900 h-32 resize-none" 
                            required 
                        />
                        <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase italic shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4">Broadcast Update</button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* RIDER NOTIFICATION MODAL */}
      <AnimatePresence>
        {showRiderNotifyModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white p-10 rounded-[3rem] w-[500px] shadow-2xl relative border border-slate-100">
                    <button onClick={() => setShowRiderNotifyModal(false)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><XCircle size={24} /></button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-8">Fleet Update</h2>
                    
                    <form onSubmit={async (e: any) => {
                        e.preventDefault();
                        if(!notifyMessage.trim()) return alert("Message cannot be empty");
                        
                        try {
                          await addDoc(collection(db, "riderUpdate"), { 
                              target: notifyTargetType === 'all' ? 'all' : notifyNumber,
                              message: notifyMessage,
                              createdAt: Timestamp.now(),
                              isRead: false,
                              status: 'unread'
                          });
                          setShowRiderNotifyModal(false);
                          setNotifyMessage("");
                          setNotifyNumber("");
                          alert("Fleet Update Pushed Successfully!");
                        } catch (error) {
                          alert("Failed to push update.");
                        }
                    }} className="space-y-4">
                        <select 
                            value={notifyTargetType} 
                            onChange={(e) => setNotifyTargetType(e.target.value)} 
                            className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-100 text-slate-900 cursor-pointer"
                        >
                            <option value="all">Broadcast to Entire Fleet</option>
                            <option value="specific">Target Specific Rider Number</option>
                        </select>
                        
                        {notifyTargetType === 'specific' && (
                            <input 
                                value={notifyNumber} 
                                onChange={(e)=>setNotifyNumber(e.target.value)} 
                                placeholder="Rider Phone (+91...)" 
                                className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-100 text-slate-900" 
                                required 
                            />
                        )}

                        <textarea 
                            value={notifyMessage}
                            onChange={(e)=>setNotifyMessage(e.target.value)}
                            placeholder="Type your instruction or alert here..." 
                            className="w-full bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-blue-100 text-slate-900 h-32 resize-none" 
                            required 
                        />
                        <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase italic shadow-xl active:scale-95 transition-all mt-4">Dispatch Alert</button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* RIDER SUPPORT CHAT MODAL */}
      <AnimatePresence>
        {showSupportModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white p-8 rounded-[3rem] w-[800px] h-[600px] shadow-2xl relative border border-slate-100 flex overflow-hidden">
                    <button onClick={() => setShowSupportModal(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all z-10"><XCircle size={20} /></button>
                    
                    {/* Left Sidebar - Rider List */}
                    <div className="w-1/3 border-r border-slate-100 pr-6 overflow-y-auto">
                        <h2 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 mb-6">Active Queries</h2>
                        <div className="space-y-3">
                            {Array.from(new Set(supportChats.map(c => c.riderId)))
                                .sort((a, b) => {
                                    const aChats = supportChats.filter(c => c.riderId === a);
                                    const bChats = supportChats.filter(c => c.riderId === b);
                                    const aLatest = aChats[aChats.length - 1]?.createdAt?.seconds || 0;
                                    const bLatest = bChats[bChats.length - 1]?.createdAt?.seconds || 0;
                                    return bLatest - aLatest; 
                                })
                                .map(riderId => {
                                const riderChats = supportChats.filter(c => c.riderId === riderId);
                                const latestMsg = riderChats[riderChats.length - 1];
                                if (!latestMsg) return null;
                                return (
                                    <div key={riderId} onClick={() => setActiveSupportRider(riderId as string)} className={`p-4 rounded-2xl cursor-pointer transition-all border ${activeSupportRider === riderId ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                                        <p className="font-black italic text-[11px] uppercase text-slate-900 truncate">Rider: {latestMsg.riderNumber || (riderId as string).slice(0,6)}</p>
                                        <p className="text-[9px] text-slate-500 truncate mt-1">{latestMsg.message}</p>
                                        {!latestMsg.resolved && latestMsg.sender === 'rider' && <span className="inline-block mt-2 text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase">Action Req</span>}
                                    </div>
                                )
                            })}
                            {supportChats.length === 0 && <p className="text-[10px] font-bold text-slate-400 italic text-center mt-10">No pending queries</p>}
                        </div>
                    </div>

                    {/* Right Side - Chat Panel */}
                    <div className="w-2/3 pl-6 flex flex-col h-full">
                        {activeSupportRider ? (
                            <>
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 shrink-0">
                                    <h3 className="font-black italic uppercase text-sm text-slate-900">Chat Session</h3>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => {
                                                const activeChats = supportChats.filter(c => c.riderId === activeSupportRider);
                                                activeChats.forEach(c => {
                                                    updateDoc(doc(db, "rider-support", c.id), { resolved: true, resolvedAt: Timestamp.now() });
                                                });
                                                setActiveSupportRider(null);
                                            }}
                                            className="text-[9px] font-black bg-green-100 text-green-600 px-3 py-1.5 rounded-xl uppercase hover:bg-green-200 transition-all"
                                        >
                                            Mark Resolved (Clean in 15m)
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm("Clear this chat instantly?")) {
                                                    const activeChats = supportChats.filter(c => c.riderId === activeSupportRider);
                                                    activeChats.forEach(c => deleteDoc(doc(db, "rider-support", c.id)));
                                                    setActiveSupportRider(null);
                                                }
                                            }}
                                            className="p-1.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                                            title="Clear Chat Instantly"
                                        >
                                            <XCircle size={14}/>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                                    {supportChats.filter(c => c.riderId === activeSupportRider).map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] p-4 rounded-2xl text-[11px] font-bold ${msg.sender === 'admin' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                                                <p>{msg.message}</p>
                                                <p className={`text-[8px] mt-2 opacity-50 ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                                                    {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'}) : 'Just now'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={async (e:any) => {
                                    e.preventDefault();
                                    if(!supportReply.trim() || !activeSupportRider) return;
                                    await addDoc(collection(db, "rider-support"), {
                                        riderId: activeSupportRider,
                                        message: supportReply,
                                        sender: 'admin',
                                        createdAt: Timestamp.now(),
                                        resolved: false
                                    });
                                    setSupportReply("");
                                }} className="shrink-0 flex gap-2">
                                    <input 
                                        value={supportReply} 
                                        onChange={(e)=>setSupportReply(e.target.value)} 
                                        placeholder="Type your reply to rider..." 
                                        className="flex-1 bg-slate-50 p-4 rounded-2xl text-[11px] font-bold outline-none border focus:border-red-100 text-slate-900" 
                                    />
                                    <button className="bg-red-600 text-white px-5 rounded-2xl hover:bg-red-700 transition-all"><Send size={16}/></button>
                                </form>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <MessageSquare size={40} className="mb-4 opacity-50"/>
                                <p className="text-[11px] font-black uppercase italic tracking-widest text-slate-400">Select a chat to respond</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* ORDER VIEW DETAILS MODAL */}
      <AnimatePresence>
        {viewOrderDetails && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white p-10 rounded-[3rem] w-[500px] shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <button onClick={() => setViewOrderDetails(null)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><XCircle size={24} /></button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">Order Details</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">ID: {viewOrderDetails.id}</p>
                    
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                            <h3 className="text-[10px] font-black uppercase italic text-slate-400 mb-3">Customer Info</h3>
                            <p className="font-black text-sm uppercase text-slate-900">{typeof viewOrderDetails.customer === 'object' ? viewOrderDetails.customer.name : (viewOrderDetails.customerName || "N/A")}</p>
                            <p className="text-[11px] font-bold text-slate-600 mt-1">{typeof viewOrderDetails.customer === 'object' ? viewOrderDetails.customer.phone : (viewOrderDetails.phone || "N/A")}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-2">{viewOrderDetails.address || (typeof viewOrderDetails.customer === 'object' ? viewOrderDetails.customer.address : "No Address Provided")}</p>
                        </div>

                        {/* Updated Breakdown Section */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                            <div className="space-y-3 mb-3">
                                {viewOrderDetails.items?.map((item:any, i:number) => (
                                    <div key={i} className="flex justify-between text-[11px] font-black italic text-slate-700 uppercase">
                                        <span className="w-2/3 truncate pr-2">{item.qty}x {item.name}</span>
                                        <span>₹{Number(item.price) * Number(item.qty)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-3 border-t border-dashed border-slate-200 text-[10px] font-black space-y-1.5">
                                <div className="flex justify-between text-slate-400">
                                    <span>Items Total</span>
                                    <span>₹{viewOrderDetails.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Platform Fee</span>
                                    <span>₹{PLATFORM_FEE}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Delivery Fee</span>
                                    <span>₹{Number(viewOrderDetails.deliveryFee) || 0}</span>
                                </div>
                                <div className="flex justify-between text-red-600 text-[13px] uppercase italic mt-2 border-t border-slate-200 pt-2">
                                    <span>Grand Total</span>
                                    <span>₹{(viewOrderDetails.items?.reduce((acc:any, i:any) => acc + (Number(i.price) * Number(i.qty)), 0) || 0) + PLATFORM_FEE + (Number(viewOrderDetails.deliveryFee) || 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                            <h3 className="text-[10px] font-black uppercase italic text-slate-400 mb-3">Dispatch Info</h3>
                            <div className="space-y-2 text-[11px] font-bold text-slate-600">
                                <div className="flex justify-between"><span>Status:</span> <span className="text-slate-900 uppercase">{viewOrderDetails.status}</span></div>
                                <div className="flex justify-between"><span>Date/Time:</span> <span>{new Date(viewOrderDetails.createdAt?.seconds ? viewOrderDetails.createdAt.seconds * 1000 : Date.now()).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'})}</span></div>
                                {viewOrderDetails.status === 'Delivered' && viewOrderDetails.updatedAt && (
                                    <div className="flex justify-between text-green-600"><span>Delivered Time:</span> <span>{new Date(viewOrderDetails.updatedAt.seconds ? viewOrderDetails.updatedAt.seconds * 1000 : Date.now()).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'})}</span></div>
                                )}
                                <div className="flex justify-between"><span>Payment Method:</span> <span className="uppercase">{viewOrderDetails.paymentMethod || 'COD'}</span></div>
                                {viewOrderDetails.assignedRider && (
                                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
                                        <span>Rider Assigned:</span>
                                        <span className="text-slate-900 uppercase">{riders.find(r => r.id === viewOrderDetails.assignedRider)?.name || viewOrderDetails.assignedRider}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronLeft, Smartphone, Search, History, CheckCircle2, Wallet, Truck, Plus, Minus, ChevronDown, AlertTriangle, Navigation, PenTool } from "lucide-react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";

// 📍 Restaurant Fixed Coordinates
const RESTAURANT_LAT = 28.5707; 
const RESTAURANT_LON = 77.2425; 

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // 📍 Address & Distance States
  const [selectedAddress, setSelectedAddress] = useState(""); 
  const [searchInput, setSearchInput] = useState(""); 
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [recentAddresses, setRecentAddresses] = useState<any[]>([]);
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");
  const [distance, setDistance] = useState<number>(0);
  const [isLocating, setIsLocating] = useState(false);
  
  // ⚙️ Logic States
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStatus, setOrderStatus] = useState(""); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  
  // 🆔 Order ID (Generated on Client to fix Hydration Error)
  const [orderId, setOrderId] = useState("");

  // 🌍 High Precision Distance Calculator
  const calculateDistance = useCallback((lat1: number, lon1: number) => {
    const R = 6371; 
    const dLat = (lat1 - RESTAURANT_LAT) * Math.PI / 180;
    const dLon = (lon1 - RESTAURANT_LON) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(RESTAURANT_LAT * Math.PI / 180) * Math.cos(lat1 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return parseFloat((R * c).toFixed(2));
  }, []);

  // 🛰️ Live Location Fetcher (Improved with strict accuracy params)
  const fetchLiveLocation = useCallback(async () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const addr = data.display_name;
        
        setSelectedAddress(addr);
        setDistance(calculateDistance(latitude, longitude));
        localStorage.setItem("rk_address", JSON.stringify({ text: addr, lat: latitude, lon: longitude }));
      } catch (e) { 
        console.error("Geocoding failed"); 
        alert("Failed to fetch address details. Please search manually.");
      }
      setIsLocating(false);
    }, (err) => {
      setIsLocating(false);
      alert("Location access denied or timeout! Please enable GPS or search manually.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }, [calculateDistance]);

  useEffect(() => {
    // 1. Generate Order ID on mount
    setOrderId(`RK${Date.now().toString().slice(-6)}`);

    // 2. Load Data
    const savedCart = localStorage.getItem("rk_cart");
    const savedAddr = localStorage.getItem("rk_address");
    const savedUser = localStorage.getItem("rk_user");
    const history = localStorage.getItem("rk_address_history");

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedUser) setUser(JSON.parse(savedUser));
    
    if (savedAddr) {
      try {
        const parsed = JSON.parse(savedAddr);
        setSelectedAddress(parsed.text || "");
        if (parsed.lat && parsed.lon) {
          setDistance(calculateDistance(parseFloat(parsed.lat), parseFloat(parsed.lon)));
        }
      } catch (e) { setSelectedAddress(savedAddr); }
    } else {
      fetchLiveLocation();
    }

    if (history) {
      try {
        const parsedHistory = JSON.parse(history);
        if (Array.isArray(parsedHistory)) setRecentAddresses(parsedHistory);
      } catch (e) {}
    }
  }, [calculateDistance, fetchLiveLocation]);

  const updateQty = (id: any, delta: number) => {
    const newCart = cart.map(item => {
      if (item.id === id) return { ...item, qty: Math.max(0, item.qty + delta) };
      return item;
    }).filter(item => item.qty > 0);
    setCart(newCart);
    localStorage.setItem("rk_cart", JSON.stringify(newCart));
  };

  const searchAddress = async (query: string) => {
    setSearchInput(query);
    if (query.length > 3) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) { console.log("Search error"); }
    } else { setSuggestions([]); }
  };

  const selectAddress = (addrData: any) => {
    const isObj = typeof addrData === 'object';
    const finalAddr = isObj ? (addrData.display_name || addrData.text) : addrData;
    
    setSelectedAddress(finalAddr);
    setSearchInput(""); 
    setSuggestions([]);
    setShowRecentDropdown(false);
    
    if (isObj && addrData.lat && addrData.lon) {
       const d = calculateDistance(parseFloat(addrData.lat), parseFloat(addrData.lon));
       setDistance(d);
       localStorage.setItem("rk_address", JSON.stringify({ text: finalAddr, lat: addrData.lat, lon: addrData.lon }));
    }

    const historyObj = isObj ? { text: finalAddr, lat: addrData.lat, lon: addrData.lon } : { text: finalAddr };
    // ✅ Max 8 addresses tak store karega
    const updatedHistory = [historyObj, ...recentAddresses.filter(a => (a.text || a) !== finalAddr)].slice(0, 8);
    setRecentAddresses(updatedHistory);
    localStorage.setItem("rk_address_history", JSON.stringify(updatedHistory));
  };

  // 🧮 Delivery Calc (Discounted Price Logic + Bulk Order Charge)
  const subtotal = cart.reduce((t, i) => t + (Math.round(Number(i.price) - (Number(i.price) * (Number(i.discount) || 0) / 100)) * i.qty), 0);
  
  // Bulk order logic: Add ₹30 extra for heavy orders ₹700 and above
  const bulkCharge = subtotal >= 700 ? 30 : 0;
  const deliveryCharge = distance > 0 ? (distance <= 2 ? 20 : 20 + Math.ceil(distance - 2) * 8) + bulkCharge : 0;
  
  const totalPayable = subtotal + deliveryCharge + 5;
  const isOutOfRange = distance > 17; 

  // ✅ Validations Check (Real-time Dynamic State instead of alerts)
  let checkoutIssue = "";
  let checkoutActionMsg = "";

  if (!user || !user.phone) {
    checkoutIssue = "Login Required";
    checkoutActionMsg = "Please login to place your order.";
  } else if (cart.length === 0) {
    checkoutIssue = "Cart is Empty";
    checkoutActionMsg = "Please add some items to your cart.";
  } else if (subtotal < 100) {
    checkoutIssue = "Minimum Order ₹100";
    checkoutActionMsg = `Add items worth ₹${100 - subtotal} more to proceed.`;
  } else if (subtotal > 1900) {
    checkoutIssue = "Maximum Order ₹1900";
    checkoutActionMsg = `Reduce items worth ₹${subtotal - 1900} to proceed.`;
  } else if (!selectedAddress || distance === 0) {
    checkoutIssue = "Address Missing";
    checkoutActionMsg = "Please select a valid delivery address.";
  } else if (isOutOfRange) {
    checkoutIssue = "Out of Zone";
    checkoutActionMsg = `Delivery limit is 17km. You are ${distance}km away.`;
  } else if (!landmark.trim()) {
    checkoutIssue = "Landmark Missing";
    checkoutActionMsg = "Please enter your Flat / House No. / Landmark.";
  }

  const isBtnDisabled = checkoutIssue !== "";

  const handleFinalOrder = async (method: string) => {
    if (!selectedAddress || distance === 0) return alert("Select a valid address first!");
    if (isOutOfRange) return alert("Outside delivery zone (17km limit)!");
    
    setIsProcessing(true);
    setShowPaymentModal(false);
    const isOnline = method !== "COD";
    setOrderStatus(isOnline ? "Pending" : "Success");

    // Process items to ensure Firebase gets the discounted price
    const finalItems = cart.map(item => ({
      ...item,
      price: Math.round(Number(item.price) - (Number(item.price) * (Number(item.discount) || 0) / 100))
    }));

    try {
      await setDoc(doc(db, "orders", orderId), {
        orderId, 
        items: finalItems, 
        total: totalPayable, 
        deliveryFee: deliveryCharge,
        platformFee: 5, 
        status: isOnline ? "Pending" : "Confirmed",
        paymentMethod: method, 
        address: selectedAddress, 
        distance, 
        landmark, 
        instructions,
        customer: user?.phone || "Guest",
        customerName: user?.name || "No Name", 
        createdAt: serverTimestamp(),
      });

      if (isOnline) {
        // App-specific UPI Deep Links
        let upiUrl = `upi://pay?pa=8650937216@yapl&pn=RamKesar&am=${totalPayable}&cu=INR&tn=${orderId}`;
        if (method === "Google Pay") upiUrl = `tez://upi/pay?pa=8650937216@yapl&pn=RamKesar&am=${totalPayable}&cu=INR&tn=${orderId}`;
        else if (method === "Paytm") upiUrl = `paytmmp://pay?pa=8650937216@yapl&pn=RamKesar&am=${totalPayable}&cu=INR&tn=${orderId}`;
        else if (method === "PhonePe") upiUrl = `phonepe://pay?pa=8650937216@yapl&pn=RamKesar&am=${totalPayable}&cu=INR&tn=${orderId}`;
        
        window.location.href = upiUrl;
      }
      
      localStorage.removeItem("rk_cart");
      setCart([]); // Clear cart instantly on client side
      
      setTimeout(() => router.push(`/orders?id=${orderId}`), 4000);
    } catch (e) { 
      setIsProcessing(false); 
      alert("Something went wrong! Please try again.");
    }
  };

  return (
    <div className="bg-[#F4F7F9] min-h-screen pb-40 font-sans select-none overflow-x-hidden">
      <div className="bg-white p-5 flex items-center justify-between sticky top-0 z-50 border-b shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 bg-slate-50 rounded-full"><ChevronLeft size={20}/></button>
          <h1 className="text-xs font-black uppercase tracking-[1px]">Checkout</h1>
        </div>
        <div className="text-[9px] font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-full uppercase">ID: {orderId || '...'}</div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* 📍 ADDRESS SECTION */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery To</label>
             <button onClick={fetchLiveLocation} className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase">
                <Navigation size={10} className={isLocating ? "animate-spin" : ""}/> {isLocating ? "Locating..." : "Use Current"}
             </button>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
             <div className="flex items-start gap-3">
                <div className="bg-black p-2 rounded-lg text-white mt-1"><MapPin size={14}/></div>
                <div className="flex-1">
                   <p className="text-[11px] font-bold text-gray-700 leading-tight line-clamp-2">
                     {selectedAddress || "Detecting your location..."}
                   </p>
                   {distance > 0 && (
                     <p className="text-[9px] font-black text-green-600 uppercase mt-1 tracking-tighter">
                        Distance: {distance} KM • Delivery: ₹{deliveryCharge}
                     </p>
                   )}
                </div>
             </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-4 top-4 text-slate-300" size={16} />
            <input 
              value={searchInput} 
              onChange={(e) => searchAddress(e.target.value)}
              placeholder="Search other location..." 
              className="w-full bg-slate-50 rounded-2xl p-4 pl-12 text-xs font-bold outline-none border border-transparent focus:border-red-200 transition-all"
            />
            <AnimatePresence>
                {suggestions.length > 0 && (
                <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-2xl mt-2 z-[70] border overflow-hidden">
                    {suggestions.map((s, i) => (
                    <div key={i} onClick={() => selectAddress(s)} className="p-4 text-[10px] font-bold border-b last:border-0 hover:bg-slate-50 cursor-pointer flex gap-3 text-gray-600">
                        <MapPin size={12} className="text-red-300 shrink-0"/> {s.display_name}
                    </div>
                    ))}
                </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* ✅ NAYA: Recent Address Dropdown (Sirf tab dikhega jab history ho) */}
          {recentAddresses.length > 0 && (
            <div className="mb-3">
              <button 
                onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                className="w-full bg-slate-50 p-3 rounded-xl flex items-center justify-between text-[10px] font-black text-gray-500 border border-slate-100 hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center gap-2"><History size={14}/> Recent Addresses</div>
                <ChevronDown size={14} className={`transition-transform ${showRecentDropdown ? 'rotate-180' : ''}`}/>
              </button>
              <AnimatePresence>
                {showRecentDropdown && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden">
                    <div className="bg-white border border-slate-100 mt-2 rounded-xl shadow-sm overflow-hidden">
                      {recentAddresses.map((addr, idx) => (
                        <div key={idx} onClick={() => selectAddress(addr)} className="p-3 text-[10px] font-bold border-b last:border-0 hover:bg-slate-50 cursor-pointer flex gap-3 text-gray-600 items-center">
                          <History size={12} className="text-slate-400 shrink-0"/> 
                          <span className="line-clamp-1">{addr.text || addr}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <input 
              value={landmark} 
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Flat / House No. / Landmark *" 
              required
              className={`w-full bg-slate-50 rounded-xl p-3 text-[11px] font-bold outline-none border ${landmark.length > 0 ? 'border-green-200' : 'border-slate-200 focus:border-red-200'}`}
            />
          </div>
        </div>

        {/* 🍱 CART ITEMS */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black uppercase text-gray-400 mb-5 tracking-widest italic">Your Order</h2>
          <div className="space-y-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-3xl">
                <div className="flex gap-3 items-center flex-1">
                  <img src={item.image} className="w-10 h-10 rounded-2xl object-cover" alt="" />
                  <div>
                    <p className="text-[11px] font-black text-gray-800 line-clamp-1">{item.name}</p>
                    <p className="text-[9px] font-bold text-gray-400">₹{Math.round(item.price - (item.price * (item.discount || 0)/100))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl shadow-sm border border-slate-100 mx-2">
                    <button onClick={() => updateQty(item.id, -1)} className="text-slate-400"><Minus size={12}/></button>
                    <span className="text-[11px] font-black w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="text-slate-400"><Plus size={12}/></button>
                </div>
                <p className="text-xs font-black text-gray-900 w-12 text-right">₹{Math.round((item.price - (item.price * (item.discount || 0)/100)) * item.qty)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
             <PenTool size={14} className="text-slate-400"/>
             <input 
               value={instructions} 
               onChange={(e) => setInstructions(e.target.value)}
               placeholder="Add cooking instructions..." 
               className="bg-transparent text-[10px] font-bold outline-none w-full"
             />
          </div>
        </div>

        {/* 📊 BILLING */}
        <div className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-100 space-y-3">
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-tighter">
            <span>Item Total</span><span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase items-center tracking-tighter">
            <span>Delivery Fee {bulkCharge > 0 && "(Bulk)"}</span>
            <span className="text-gray-800 font-black">₹{deliveryCharge}</span>
          </div>
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-tighter">
            <span>Platform Fee</span><span>₹5</span>
          </div>
          <div className="h-[1px] bg-slate-100 w-full my-2" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-black text-gray-800 uppercase italic">To Pay</span>
            <span className="text-3xl font-black text-red-600 tracking-tighter">₹{totalPayable}</span>
          </div>
        </div>

        {/* ✅ Dynamic Validation Warning Box - Shown right above the button */}
        {isBtnDisabled && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-[20px] flex items-center gap-3">
            <AlertTriangle size={20} className="shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase leading-tight">{checkoutIssue}</p>
              <p className="text-[10px] font-bold mt-0.5">{checkoutActionMsg}</p>
            </div>
            {(!user || !user.phone) && (
              <button onClick={() => router.push('/?login=true')} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm active:scale-95 transition-all">
                Login
              </button>
            )}
          </div>
        )}

        {/* ✅ Payment Button with Dynamic Text and Disabled State */}
        <button 
          disabled={isBtnDisabled}
          onClick={() => setShowPaymentModal(true)} 
          className="w-full bg-black text-white p-5 rounded-[30px] font-black text-[12px] uppercase tracking-[3px] shadow-2xl disabled:bg-slate-300 disabled:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isBtnDisabled ? checkoutIssue : "Choose Payment"} <Smartphone size={18}/>
        </button>
      </div>

      {/* 💳 PAYMENT SELECTION MODAL */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPaymentModal(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 bg-white z-[110] rounded-t-[50px] p-8 max-w-md mx-auto shadow-2xl">
              <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-6" />
              <h2 className="text-lg font-black mb-8 italic">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: "Google Pay", icon: Smartphone, color: "bg-blue-500" },
                  { id: "Paytm", icon: Smartphone, color: "bg-sky-500" },
                  { id: "PhonePe", icon: Smartphone, color: "bg-purple-600" },
                  { id: "COD", icon: Truck, color: "bg-green-600" }
                ].map((m) => (
                  <button key={m.id} onClick={() => handleFinalOrder(m.id)} className="flex items-center gap-4 w-full p-5 bg-slate-50 rounded-[28px] hover:bg-slate-100 transition-all">
                    <div className={`p-3 rounded-2xl ${m.color} text-white shadow-lg`}><m.icon size={18}/></div>
                    <span className="font-black text-[11px] uppercase tracking-wider text-gray-700">{m.id}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {isProcessing && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-8 text-center">
             {orderStatus === 'Success' ? (
                <>
                  <img src="https://media.tenor.com/9vU3aB2tL7gAAAAj/chef-cooking.gif" className="w-40 h-40 mb-2 mix-blend-multiply" />
                  <h2 className="text-3xl font-black italic">ORDER PLACED!</h2>
                  <div className="mt-8 bg-slate-50 p-6 rounded-[30px] w-full max-w-[280px] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase">Order ID</p>
                     <p className="text-2xl font-black tracking-widest mt-2">#{orderId}</p>
                     <p className="text-[9px] font-black text-green-500 uppercase mt-4">RamKesar is preparing...</p>
                  </div>
                </>
             ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <h2 className="text-xl font-black italic uppercase">Processing...</h2>
                </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

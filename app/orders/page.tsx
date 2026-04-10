"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { 
  ShoppingBag, ArrowLeft, ChevronRight, X, 
  CheckCircle2, Clock, MapPin, Phone, 
  Package, Truck, Star, RotateCcw, Bike, ChevronLeft, Receipt
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("rk_user");
    if (!savedUser) { router.push("/"); return; }
    const phone = JSON.parse(savedUser).phone;

    const q = query(
      collection(db, "orders"),
      where("customer", "==", phone),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const handleRatingSubmit = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        rating: rating,
        customerFeedback: comment,
        status: "Reviewed"
      });
      alert("Review Submitted! Thank you.");
      setSelectedOrder(null);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#FBFBFB] pb-24 font-sans">
      <header className="p-5 bg-white border-b flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-gray-50 rounded-full active:scale-90"><ArrowLeft size={20} /></button>
        <h1 className="font-black italic text-xl uppercase tracking-tighter">My Orders</h1>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* EMPTY STATE LOGIC */}
        {!loading && orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <ShoppingBag size={40} />
            </div>
            <h2 className="text-xl font-black italic text-gray-900 uppercase tracking-tighter mb-2">No Order History</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8 italic">Looks like you haven't placed any orders yet.</p>
            <button 
              onClick={() => router.push("/")} 
              className="bg-black text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[2px] shadow-xl active:scale-95 transition-all"
            >
              Order Something Now
            </button>
          </motion.div>
        ) : (
          orders.map((order) => {
            const finalTotal = order.totalAmount || order.total || order.price || 0;
            return (
              <motion.div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm relative active:scale-[0.98] transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase italic border ${order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {order.status || "Processing"}
                  </span>
                  <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">#{order.id.slice(-6).toUpperCase()}</p>
                </div>

                <h3 className="font-black text-sm text-gray-900 uppercase italic truncate mb-4 pr-6">
                  {order.items?.[0]?.name} {order.items?.length > 1 ? `+${order.items.length - 1} more` : ""}
                </h3>
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <div>
                    <p className="text-[8px] font-black text-gray-300 uppercase mb-1 tracking-tighter italic">{order.paymentMethod || "COD"}</p>
                    <p className="font-black text-lg text-gray-900 italic">₹{finalTotal}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => {e.stopPropagation(); router.push('/');}} className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-95"><RotateCcw size={18}/></button>
                    <div className="bg-red-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase italic shadow-md shadow-red-100 group-hover:bg-black transition-colors">View Details</div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-md rounded-t-[3rem] h-[92vh] overflow-y-auto p-8 relative shadow-2xl">
              
              {/* HEADER WITH BACK BUTTON */}
              <div className="flex items-center justify-between mb-8">
                 <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 bg-gray-50 px-5 py-2.5 rounded-full text-gray-900 font-black text-[10px] uppercase italic active:scale-90 shadow-sm border border-gray-100">
                    <ChevronLeft size={16}/> Back to List
                 </button>
                 <X size={20} className="text-gray-300 cursor-pointer" onClick={() => setSelectedOrder(null)} />
              </div>

              {/* RIDER BIKE STATUS */}
              {(selectedOrder.status !== "Delivered" && selectedOrder.status !== "Reviewed") && (
                <div className="bg-gray-900 p-5 rounded-[2.5rem] mb-8 border border-white/5 relative overflow-hidden">
                   <div className="flex justify-between items-center mb-4 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="w-11 h-11 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3"><Bike size={22}/></div>
                         <div>
                            <p className="text-white font-black text-[12px] uppercase italic tracking-tight">{selectedOrder.riderName || "Matching Rider..."}</p>
                            <p className="text-red-400 text-[9px] font-bold uppercase mt-1">Arrival in {selectedOrder.eta || "15-20"} mins</p>
                         </div>
                      </div>
                      {selectedOrder.riderPhone && (
                        <a href={`tel:${selectedOrder.riderPhone}`} className="bg-white/10 p-3 rounded-xl text-white active:scale-90 border border-white/5"><Phone size={18}/></a>
                      )}
                   </div>
                   <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden">
                      <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                   </div>
                </div>
              )}

              {/* BILL BREAKDOWN */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt size={16} className="text-red-600" />
                  <h2 className="text-lg font-black italic uppercase text-gray-900 tracking-tighter">Bill Summary</h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                   <div className="space-y-3">
                      {selectedOrder.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-bold italic text-gray-600 uppercase">
                           <span>{item.qty} x {item.name}</span>
                           <span className="font-black text-gray-900">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                   </div>

                   <div className="h-px bg-gray-50 w-full" />

                   <div className="space-y-2 text-[10px] font-bold uppercase italic text-gray-400">
                      <div className="flex justify-between">
                         <span>Item Total</span>
                         <span>₹{selectedOrder.items?.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span>Delivery Partner Fee</span>
                         <span className={selectedOrder.deliveryFee > 0 ? "text-gray-900" : "text-green-600 font-black"}>
                           {selectedOrder.deliveryFee > 0 ? `₹${selectedOrder.deliveryFee}` : "FREE"}
                         </span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span>Platform Fee</span>
                         <span className="text-gray-900">₹{selectedOrder.platformFee || 0}</span>
                      </div>
                      <div className="flex justify-between">
                         <span>Taxes & Restaurant Charges</span>
                         <span>₹{selectedOrder.taxes || 0}</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-red-500">
                           <span>RamKesar Discount</span>
                           <span>-₹{selectedOrder.discount}</span>
                        </div>
                      )}
                   </div>

                   <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black text-gray-300 uppercase mb-1">Grand Total</p>
                        <p className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-fit mb-1">{selectedOrder.paymentMethod || "CASH ON DELIVERY"}</p>
                      </div>
                      <span className="text-2xl font-black italic text-gray-900">₹{selectedOrder.totalAmount || selectedOrder.total || selectedOrder.price}</span>
                   </div>
                </div>
              </div>

              {/* RATING / FEEDBACK */}
              {selectedOrder.status === "Delivered" && (
                <div className="bg-yellow-50/50 p-6 rounded-[2.5rem] border border-yellow-100 mb-8">
                   <div className="flex items-center justify-center gap-3 mb-4">
                     {[1,2,3,4,5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} className="active:scale-90 transition-transform">
                          <Star size={30} fill={s <= rating ? "#EAB308" : "none"} stroke={s <= rating ? "#EAB308" : "#FEF08A"} />
                        </button>
                      ))}
                   </div>
                   <textarea placeholder="Share your feedback..." onChange={(e) => setComment(e.target.value)} className="w-full bg-white p-4 rounded-2xl text-[11px] font-bold outline-none border border-yellow-100 h-20 mb-3 italic" />
                   <button onClick={() => handleRatingSubmit(selectedOrder.id)} className="w-full bg-yellow-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-yellow-100">Submit Review</button>
                </div>
              )}

              {/* DELIVERY LOCATION */}
              <div className="flex items-start gap-4 px-2">
                 <div className="p-3 bg-red-50 rounded-2xl text-red-600"><MapPin size={18} /></div>
                 <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1 italic">Delivered To</p>
                    <p className="text-[11px] font-bold text-gray-700 italic leading-relaxed">{selectedOrder.address || "Saved Location"}</p>
                 </div>
              </div>

              <p className="text-center mt-10 text-[8px] font-black text-gray-200 uppercase tracking-[0.4em] italic">RamKesar Foods Invoice</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

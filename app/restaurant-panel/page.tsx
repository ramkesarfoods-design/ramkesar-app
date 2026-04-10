"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(data);
    });

    return () => unsub();
  }, []);

  const today = new Date().toDateString();

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt?.seconds * 1000);
    return d.toDateString() === today;
  });

  return (
    <div className="min-h-screen bg-gray-100">

      {/* 🔝 TOP BAR */}
      <div className="flex justify-between items-center p-4 bg-white shadow">
        <h1 className="text-xl font-bold">🍽️ Restaurant Panel</h1>

        <div className="flex items-center gap-4">
          <div className="font-semibold">👤 Owner</div>

          {/* 3 DOT MENU */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-2xl"
            >
              ⋮
            </button>

            {showMenu && (
              <div className="absolute right-0 bg-white shadow rounded mt-2 w-48">
                <a href="/restaurant-panel/menu" className="block p-2 hover:bg-gray-100">Menu Management</a>
                <a href="/restaurant-panel/item-sales" className="block p-2 hover:bg-gray-100">Item Wise Sales</a>
                <a href="/restaurant-panel/sales" className="block p-2 hover:bg-gray-100">Sales Dashboard</a>
                <a href="/restaurant-panel/orders" className="block p-2 hover:bg-gray-100">Order History</a>
                <a href="/restaurant-panel/customers" className="block p-2 hover:bg-gray-100">Customer Details</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📦 TODAY LIVE ORDERS */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-3">🔥 Today Live Orders</h2>

        {todayOrders.length === 0 ? (
          <p>No orders today</p>
        ) : (
          todayOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-4 mb-3 rounded shadow"
            >
              <p className="font-bold">Order ID: {order.id}</p>
              <p>Total: ₹{order.total}</p>
              <p>Status: {order.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

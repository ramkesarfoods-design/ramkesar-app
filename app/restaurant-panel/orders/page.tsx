"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");

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

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
  };

  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((o) => o.status === filter);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">📦 Orders</h1>

      <select onChange={(e) => setFilter(e.target.value)} className="mb-4 border p-2">
        <option>All</option>
        <option>Pending</option>
        <option>Preparing</option>
        <option>Delivered</option>
      </select>

      {filteredOrders.map((order) => (
        <div key={order.id} className="border p-3 mb-3">
          <p>Order ID: {order.id}</p>
          <p>Total: ₹{order.total}</p>
          <p>Status: {order.status}</p>

          <button onClick={() => updateStatus(order.id, "Preparing")} className="mr-2 text-blue-500">
            Preparing
          </button>

          <button onClick={() => updateStatus(order.id, "Delivered")} className="text-green-500">
            Delivered
          </button>
        </div>
      ))}
    </div>
  );
}

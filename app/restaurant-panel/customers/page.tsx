"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { collection, getDocs } from "firebase/firestore";

export default function CustomersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const snapshot = await getDocs(collection(db, "orders"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOrders(data);
  };

  const customerMap = {};

  orders.forEach((order) => {
    const user = order.userId || "Guest";

    if (!customerMap[user]) {
      customerMap[user] = 0;
    }

    customerMap[user] += Number(order.total || 0);
  });

  const customers = Object.entries(customerMap);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">👤 Customers</h1>

      {customers.map(([user, total], i) => (
        <div key={i} className="border p-2 mb-2">
          {user} - ₹{total}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { collection, getDocs } from "firebase/firestore";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function SalesDashboard() {
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

  // 📊 SALES BY DATE
  const salesByDate = {};

  orders.forEach((order) => {
    const timestamp = order.createdAt?.seconds;

    if (!timestamp) return;

    const date = new Date(timestamp * 1000).toLocaleDateString();

    if (!salesByDate[date]) {
      salesByDate[date] = 0;
    }

    salesByDate[date] += Number(order.total || 0);
  });

  const labels = Object.keys(salesByDate);
  const dataValues = Object.values(salesByDate);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Daily Sales ₹",
        data: dataValues,
      },
    ],
  };

  // 🥇 BEST SELLING ITEMS (SAFE FIX)
  const itemMap = {};

  orders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = 0;
        }
        itemMap[item.name]++;
      });
    }
  });

  const bestItems = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 📦 TOTAL STATS
  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const totalOrders = orders.length;

  const avgOrder =
    totalOrders > 0 ? Math.floor(totalRevenue / totalOrders) : 0;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        📊 Sales Dashboard
      </h1>

      {/* 📦 STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2>Total Revenue</h2>
          <p className="text-xl font-bold">₹{totalRevenue}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2>Total Orders</h2>
          <p className="text-xl font-bold">{totalOrders}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2>Avg Order Value</h2>
          <p className="text-xl font-bold">₹{avgOrder}</p>
        </div>
      </div>

      {/* 📊 CHART */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <Bar data={chartData} />
      </div>

      {/* 🥇 BEST SELLING */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-2">
          🔥 Best Selling Items
        </h2>

        {bestItems.length === 0 ? (
          <p>No data</p>
        ) : (
          bestItems.map(([name, count], i) => (
            <div key={i}>
              {name} - {count} orders
            </div>
          ))
        )}
      </div>
    </div>
  );
}

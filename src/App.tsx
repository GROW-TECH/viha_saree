import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  Menu,
  X,
  ShoppingCart
} from "lucide-react";
import { useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";

// Pages
import ClientRegister from "./components/ClientRegister";
import ProductRegister from "./components/ProductRegister";
import PurchasePage from "./components/Purchase";
import  {Dashboard}  from "./components/Dashboard";
import ProductionRegister from "./components/ProductionRegister";
import MaterialRegister from "./components/MaterialRegister";
import OrderRegister from "./components/OrderRegister";
import CompletedOrders from "./components/CompletedOrders";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/clients", icon: Users, label: "Client Register" },
    { path: "/material", icon: Users, label: "Materials Add" },
    { path: "/products", icon: Package, label: "Product" },
    { path: "/purchase", icon: ShoppingCart, label: "Purchase" },
    { path: "/place-order", icon: Layers, label: "Order" },
    { path: "/completed-orders", icon: Layers, label: "Completed Order" }
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/20 rounded"
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <h1 className="text-2xl font-bold">Viha Sarees Management</h1>
          </div>

          <span className="text-sm">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric"
            })}
          </span>
        </div>
      </header>

      {/* Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:static inset-y-0 left-0 w-64 bg-white border-r-2 border-gray-300 z-20 transition-transform duration-300 flex flex-col mt-16 lg:mt-0`}
        >
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end
                      onClick={() => {
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? "bg-amber-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                        }`
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t-2 border-gray-200 bg-amber-50 text-center text-xs">
            © 2024 Viha Sarees
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden mt-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto mt-16 lg:mt-0">
          <Routes>
  <Route index element={<Dashboard />} />
  <Route path="clients" element={<ClientRegister />} />
  <Route path="products" element={<ProductRegister />} />
  <Route path="purchase" element={<PurchasePage />} />
  <Route path="place-order" element={<OrderRegister />} />
  <Route path="material" element={<MaterialRegister />} />
  <Route path="completed-orders" element={<CompletedOrders />} />
</Routes>

        </main>
      </div>
    </div>
  );
}

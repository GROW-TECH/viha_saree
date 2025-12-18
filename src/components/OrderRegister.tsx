import { useEffect, useState } from "react";
import { Trash2, Edit, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";

/* ---------- INTERFACES ---------- */
interface Customer {
  id: string;
  customer_code: string;
}

interface Material {
  id: string;
  material_name: string;
  stock: number;
}

interface OrderItem {
  materialId: string;
  materialName: string;
  qty: number;
  returnQty?: number;
}

interface Order {
  id: string;
  order_date: string;
  customer_name: string;
  salary: number;
  status: string;
  product_qty?: number;     // ✅ ordered
  product_count?: number;   // returned
  items?: OrderItem[];
}


/* ---------- COMPONENT ---------- */
export default function OrderRegister() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [orderDate, setOrderDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [salary, setSalary] = useState("");
  const [productCount, setProductCount] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"ADD" | "EDIT" | "COMPLETE">("ADD");

  const [images, setImages] = useState<File[]>([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadMaterials();
  }, []);

  async function loadOrders() {
    const res = await fetch("http://localhost:4000/orders");
    setOrders(await res.json());
  }

  async function loadCustomers() {
    const res = await fetch("http://localhost:4000/clients");
    setCustomers(await res.json());
  }

  async function loadMaterials() {
    const res = await fetch("http://localhost:4000/materials");
    setMaterials(await res.json());
  }

  /* ---------- FILTER ---------- */
  const filteredOrders = orders.filter(o => {
    const d = new Date(o.order_date);
    const f = fromDate ? new Date(fromDate) : null;
    const t = toDate ? new Date(toDate) : null;
    if (t) t.setHours(23, 59, 59, 999);
    return (!f || d >= f) && (!t || d <= t);
  });

  /* ---------- MATERIAL ---------- */
  function addMaterial(id: string) {
    const m = materials.find(x => x.id === id);
    if (!m) return;
    setOrderItems(p => [...p, { materialId: m.id, materialName: m.material_name, qty: 1 }]);
  }

  function updateQty(i: number, v: number) {
    const c = [...orderItems];
    c[i].qty = v;
    setOrderItems(c);
  }

  function removeItem(i: number) {
    setOrderItems(p => p.filter((_, x) => x !== i));
  }

  /* ---------- SAVE ---------- */
  async function saveOrder() {
    if (!orderDate || !customerName || !productCount) {
      alert("Fill all required fields");
      return;
    }

    if (mode === "COMPLETE") {
      const fd = new FormData();
      fd.append("productCount", productCount);
      fd.append("items", JSON.stringify(orderItems));
      images.forEach(i => fd.append("images", i));

      await fetch(`http://localhost:4000/orders/${editingId}/complete`, {
        method: "POST",
        body: fd,
      });
    } else {
      const url =
        mode === "EDIT"
          ? `http://localhost:4000/orders/${editingId}`
          : "http://localhost:4000/orders";

      await fetch(url, {
        method: mode === "EDIT" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderDate,
          customerName,
          salary,
          productQty:productCount,
          items: orderItems,
        }),
      });
    }

    resetForm();
    loadOrders();
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setOrderItems([]);
    setOrderDate("");
    setCustomerName("");
    setSalary("");
    setProductCount("");
    setImages([]);
    setMode("ADD");
  }

  /* ---------- ACTIONS ---------- */
  function editOrder(o: Order) {
    console.log(o);
    
    setMode("EDIT");
    setEditingId(o.id);
    setOrderDate(o.order_date);
    setCustomerName(o.customer_name);
    setSalary(String(o.salary));
    setProductCount(String(o.product_qty || ""));
    setOrderItems(o.items || []);
    setShowForm(true);
  }

  function completeOrder(o: Order) {
    setMode("COMPLETE");
    setEditingId(o.id);
    setOrderDate(o.order_date);
    setCustomerName(o.customer_name);
    setSalary(String(o.salary));
    setProductCount(String(o.product_qty || ""));
    setOrderItems(o.items?.map(i => ({ ...i, returnQty: 0 })) || []);
    setShowForm(true);
  }

  async function deleteOrder(id: string) {
    if (!confirm("Delete this order?")) return;
    await fetch(`http://localhost:4000/orders/${id}`, { method: "DELETE" });
    loadOrders();
  }

  /* ---------- UI ---------- */
  return (
    <div className="p-4 bg-white h-full">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-red-800">Order Register</h1>
        <button
          onClick={() => {
            setMode("ADD");
            setShowForm(true);
          }}
          className="bg-amber-600 text-white px-4 py-2 rounded"
        >
          New Order
        </button>
      </div>

      {showForm && (
        <div className="border p-4 rounded mb-4 shadow">
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              className="border p-2 rounded" />

            <select value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="border p-2 rounded">
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.customer_code}>
                  {c.customer_code}
                </option>
              ))}
            </select>

            <input placeholder="Salary" value={salary}
              onChange={e => setSalary(e.target.value)}
              className="border p-2 rounded" />
          </div>

          {/* PRODUCT COUNT */}
          <input
            type="number"
            placeholder={mode === "COMPLETE"
              ? "Return Product Count (Saree)"
              : "Product Count (Saree)"}
            value={productCount}
            onChange={e => setProductCount(e.target.value)}
            className="border p-2 rounded w-full mt-4"
          />

          {mode !== "COMPLETE" && (
            <select className="border p-2 rounded w-full mt-4"
              onChange={e => addMaterial(e.target.value)}>
              <option value="">Add Material</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.material_name} (Stock: {m.stock})
                </option>
              ))}
            </select>
          )}

          {orderItems.map((i, idx) => (
            <div key={idx} className="flex gap-2 mt-2">
              <span className="flex-1">{i.materialName}</span>
              <input type="number" value={i.qty}
                onChange={e => updateQty(idx, +e.target.value)}
                className="border w-24 px-2" />
              <Trash2 onClick={() => removeItem(idx)}
                className="text-red-600 cursor-pointer" />
            </div>
          ))}

          {mode === "COMPLETE" && (
            <>
              {orderItems.map((i, idx) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <span className="flex-1">{i.materialName} Return</span>
                  <input type="number" value={i.returnQty || 0}
                    onChange={e => {
                      const c = [...orderItems];
                      c[idx].returnQty = +e.target.value;
                      setOrderItems(c);
                    }}
                    className="border w-24 px-2" />
                </div>
              ))}
              <input type="file" multiple accept="image/*"
                onChange={e => setImages(Array.from(e.target.files || []))}
                className="border p-2 rounded mt-3 w-full" />
            </>
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={saveOrder}
              className="bg-green-600 text-white px-4 py-2 rounded">
              {mode === "COMPLETE" ? "Complete Order" : editingId ? "Update Order" : "Save Order"}
            </button>
            <button onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead className="bg-amber-100 border-b-2 border-red-700">
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Salary</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(o => (
            <tr key={o.id} className="border">
              <td>{o.order_date}</td>
              <td>{o.customer_name}</td>
              <td>{o.product_qty}</td>
              <td>{o.salary}</td>
              <td>{o.status}</td>
              <td className="flex gap-2">
                <Edit onClick={() => editOrder(o)} />
                <CheckCircle onClick={() => completeOrder(o)} />
                <Trash2 onClick={() => deleteOrder(o.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

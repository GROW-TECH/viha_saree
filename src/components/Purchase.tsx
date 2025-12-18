import { useState, useEffect } from "react";
import { Trash2, Edit } from "lucide-react";
import * as XLSX from "xlsx";

/* ---------- INTERFACES ---------- */
interface MaterialEntry {
  id: string;
  material_code: string;
  material_name: string;
  stock?: number;
}

interface PurchaseEntry {
  id: string;
  date: string;
  productCode: string;
  productName: string;
  quantity: string;
}

/* ---------- COMPONENT ---------- */
export default function PurchaseRegister() {
  const [materials, setMaterials] = useState<MaterialEntry[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialEntry | null>(null);
  const [quantity, setQuantity] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ---------- LOAD MATERIALS ---------- */
  useEffect(() => {
    fetch("http://localhost:4000/materials")
      .then((res) => res.json())
      .then(setMaterials);
  }, []);

  /* ---------- LOAD PURCHASES ---------- */
  useEffect(() => {
    loadPurchases();
  }, []);

  async function loadPurchases() {
    const res = await fetch("http://localhost:4000/api/purchases");
    setPurchases(await res.json());
  }

  /* ---------- FILTER ---------- */
  const filteredPurchases = purchases.filter((p) => {
    const pDate = new Date(p.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return (!from || pDate >= from) && (!to || pDate <= to);
  });

  /* ---------- EXPORT ---------- */
  function exportPurchasesToExcel() {
    const data = filteredPurchases.map((p, index) => ({
      "Sr No": index + 1,
      Date: p.date,
      "Material Code": p.productCode,
      "Material Name": p.productName,
      Quantity: p.quantity,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "purchases.xlsx");
  }

  /* ---------- FORM ---------- */
  function resetForm() {
    setDate("");
    setSelectedMaterial(null);
    setQuantity("");
    setEditingId(null);
  }

  function addNewPurchase() {
    resetForm();
    setShowForm(true);
  }

  async function savePurchase() {
    if (!date || !selectedMaterial || !quantity) {
      alert("Fill all fields");
      return;
    }

    const payload = {
      date,
      productCode: selectedMaterial.material_code,
      productName: selectedMaterial.material_name,
      quantity,
    };

    const url = editingId
      ? `http://localhost:4000/api/purchases/${editingId}`
      : "http://localhost:4000/api/purchases";

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await loadPurchases();
    setShowForm(false);
    resetForm();
  }

  function editPurchase(p: PurchaseEntry) {
    setEditingId(p.id);
    setDate(p.date);
    setQuantity(p.quantity);
    setSelectedMaterial(
      materials.find((m) => m.material_code === p.productCode) || null
    );
    setShowForm(true);
  }

  async function deletePurchase(id: string) {
    if (!confirm("Delete this purchase?")) return;
    await fetch(`http://localhost:4000/api/purchases/${id}`, {
      method: "DELETE",
    });
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  }

  /* ---------- UI ---------- */
  return (
    <div className="p-4 bg-white">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-800">
            Purchase Register
          </h1>

          <div className="flex gap-2">
            <button
              onClick={addNewPurchase}
              className="bg-amber-600 text-white px-4 py-2 rounded"
            >
              New Purchase
            </button>

            <button
              onClick={exportPurchasesToExcel}
              className="bg-green-700 text-white px-4 py-2 rounded"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex gap-4">
          <div>
            <label className="text-sm">From</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">To</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="self-end bg-gray-400 text-white px-3 py-1 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border p-4 mb-4 rounded space-y-2">
          <input
            type="date"
            className="border w-full px-2 py-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className="border w-full px-2 py-1"
            value={selectedMaterial?.id || ""}
            onChange={(e) =>
              setSelectedMaterial(
                materials.find((m) => m.id === e.target.value) || null
              )
            }
          >
            <option value="">Select Material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.material_code} - {m.material_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="border w-full px-2 py-1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <button
            onClick={savePurchase}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {editingId ? "Update" : "Save"}
          </button>
        </div>
      )}

      {/* Table */}
      <table className="w-full border">
        <thead className="bg-amber-100">
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Material</th>
            <th>Qty</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredPurchases.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td>{p.date}</td>
              <td>{p.productName}</td>
              <td>{p.quantity}</td>
              <td className="flex gap-2">
                <Edit size={16} onClick={() => editPurchase(p)} />
                <Trash2 size={16} onClick={() => deletePurchase(p.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

interface Purchase {
  id: string;
  date: string;
  customerCode: string;
  productCode: string;
  productName: string;
  quantity: string;
}

interface Production {
  id: string;
  date: string;
  customerCode: string;
  product: string;
  customerQty: string;
  manufactureQty: string;
  threadQty: string;
  silkThreadQty: string;
  returnQty?: string;
  statusDesc: "Processing" | "Completed";
  qrCode?: string;
  wastage?: string;
  salary?: string;
  closingPhoto?: string;
}

export default function ProductionRegister() {

  /* ✅ LOAD FROM LOCALSTORAGE IMMEDIATELY */
  const [purchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem("purchases");
    return saved ? JSON.parse(saved) : [];
  });

  const [records, setRecords] = useState<Production[]>(() => {
    const saved = localStorage.getItem("productions");
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState<Production>({
    id: "",
    date: "",
    customerCode: "",
    product: "",
    customerQty: "",
    manufactureQty: "",
    threadQty: "",
    silkThreadQty: "",
    returnQty: "",
    statusDesc: "Processing",
    qrCode: "",
    wastage: "",
    salary: "",
    closingPhoto: "",
  });

  const qtyOptions = ["100g", "200g", "300g", "400g", "500g"];

  /* ✅ SAVE AUTOMATICALLY */
  useEffect(() => {
    localStorage.setItem("productions", JSON.stringify(records));
  }, [records]);

  const filtered = records.filter((r) =>
    r.customerCode.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      id: "",
      date: "",
      customerCode: "",
      product: "",
      customerQty: "",
      manufactureQty: "",
      threadQty: "",
      silkThreadQty: "",
      returnQty: "",
      statusDesc: "Processing",
      qrCode: "",
      wastage: "",
      salary: "",
      closingPhoto: "",
    });
    setEditId(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (editId) {
      setRecords(prev =>
        prev.map(r => (r.id === editId ? { ...form, id: editId } : r))
      );
    } else {
      setRecords(prev => [{ ...form, id: crypto.randomUUID() }, ...prev]);
    }

    setShowForm(false);
    resetForm();
  };

  const handleEdit = (row: Production) => {
    setForm(row);
    setEditId(row.id);
    setShowForm(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () =>
      setForm(prev => ({ ...prev, closingPhoto: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 bg-white">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-red-800">Production Register</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-amber-600 text-white px-4 py-2 rounded flex gap-2 items-center"
        >
          <Plus size={18} /> Add Order
        </button>
      </div>

      {/* SEARCH */}
      <input
        className="border px-2 py-1 rounded mb-4 w-full"
        placeholder="Search by Customer Code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border p-4 rounded mb-4 flex flex-col gap-2">

          <input type="date" className="border px-2 py-1"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required />

          <select className="border px-2 py-1" value={form.product}
            onChange={(e) => {
              const selected = purchases.find(p => p.productCode === e.target.value);
              if (selected) {
                setForm({
                  ...form,
                  product: selected.productCode,
                  customerCode: selected.customerCode,
                  customerQty: selected.quantity,
                });
              }
            }} required>
            <option value="">Select Product</option>
            {purchases.map(p => (
              <option key={p.id} value={p.productCode}>
                {p.productCode} - {p.productName}
              </option>
            ))}
          </select>

          <input className="border px-2 py-1 bg-gray-100" value={form.customerCode} readOnly />
          <input className="border px-2 py-1 bg-gray-100" value={form.customerQty} readOnly />

          <select className="border px-2 py-1"
            value={form.manufactureQty}
            onChange={(e) => setForm({ ...form, manufactureQty: e.target.value })}
            required>
            <option value="">Manufacture Qty</option>
            {qtyOptions.map(q => <option key={q}>{q}</option>)}
          </select>

          <select className="border px-2 py-1"
            value={form.threadQty}
            onChange={(e) => setForm({ ...form, threadQty: e.target.value })}>
            <option value="">Thread Qty</option>
            {qtyOptions.map(q => <option key={q}>{q}</option>)}
          </select>

          <select className="border px-2 py-1"
            value={form.silkThreadQty}
            onChange={(e) => setForm({ ...form, silkThreadQty: e.target.value })}>
            <option value="">Silk Thread Qty</option>
            {qtyOptions.map(q => <option key={q}>{q}</option>)}
          </select>

          <select className="border px-2 py-1"
            value={form.statusDesc}
            onChange={(e) => setForm({ ...form, statusDesc: e.target.value as any })}>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>

          {form.statusDesc === "Completed" && (
            <>
              <select className="border px-2 py-1"
                value={form.returnQty}
                onChange={(e) => setForm({ ...form, returnQty: e.target.value })}>
                <option value="">Return Qty</option>
                {qtyOptions.map(q => <option key={q}>{q}</option>)}
              </select>

              <input placeholder="QR Code" className="border px-2 py-1"
                value={form.qrCode}
                onChange={(e) => setForm({ ...form, qrCode: e.target.value })} />

              <input placeholder="Wastage" className="border px-2 py-1"
                value={form.wastage}
                onChange={(e) => setForm({ ...form, wastage: e.target.value })} />

              <input placeholder="Salary" className="border px-2 py-1"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })} />

              <input type="file" accept="image/*" onChange={handleFileChange} />
            </>
          )}

          <button className="bg-green-600 text-white py-2 rounded">Save</button>
        </form>
      )}

      {/* TABLE */}
      <table className="w-full border-collapse">
        <thead className="bg-amber-100">
          <tr>
            {["Sr","Date","Customer","Product","Customer Qty","Manufacture Qty","Thread Qty","Silk Qty","Status","Return","QR","Wastage","Salary","Photo","Action"]
              .map(h => <th key={h} className="border px-2 py-2">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={r.id}>
              <td className="border px-2">{i + 1}</td>
              <td className="border px-2">{r.date}</td>
              <td className="border px-2">{r.customerCode}</td>
              <td className="border px-2">{r.product}</td>
              <td className="border px-2">{r.customerQty}</td>
              <td className="border px-2">{r.manufactureQty}</td>
              <td className="border px-2">{r.threadQty}</td>
              <td className="border px-2">{r.silkThreadQty}</td>
              <td className="border px-2">{r.statusDesc}</td>
              <td className="border px-2">{r.returnQty || "-"}</td>
              <td className="border px-2">{r.qrCode}</td>
              <td className="border px-2">{r.wastage}</td>
              <td className="border px-2">{r.salary}</td>
              <td className="border px-2">
                {r.closingPhoto && <img src={r.closingPhoto} className="h-10 w-10" />}
              </td>
              <td className="border px-2 flex gap-2 justify-center">
                <button onClick={() => handleEdit(r)} className="text-blue-600">
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setRecords(prev => prev.filter(x => x.id !== r.id))}
                  className="text-red-600">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

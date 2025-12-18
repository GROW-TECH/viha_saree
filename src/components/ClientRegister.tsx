import { useState, useEffect } from "react";
import { Trash2, Edit } from "lucide-react";
import * as XLSX from "xlsx";


interface ClientEntry {
  id: string;
  customerCode: string;
  customerName: string;
  phoneNumber: string;
  place: string;
}

export default function ClientRegister() {
  const [clients, setClients] = useState<ClientEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [place, setPlace] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  async function loadClients() {
  const res = await fetch("http://localhost:4000/clients");
  const data = await res.json();

  const list = Array.isArray(data) ? data : data.data;

  
  setClients(
    list.map((c: any) => ({
      id: c.id,
      customerCode: c.customer_code,
      customerName: c.customer_name,
      phoneNumber: c.phone_number,
      place: c.place,
    }))
  );
}

function exportToExcel() {
  const data = clients.map((c, index) => ({
    "Sr No": index + 1,
    "Customer Code": c.customerCode,
    "Customer Name": c.customerName,
    "Phone Number": c.phoneNumber,
    Place: c.place,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

  XLSX.writeFile(workbook, "clients.xlsx");
}


useEffect(() => {
  loadClients();
}, []);

  /* -------- SAVE TO STORAGE -------- */
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("clients", JSON.stringify(clients));
  }, [clients, loaded]);

  function resetForm() {
    setCustomerCode("");
    setCustomerName("");
    setPhoneNumber("");
    setPlace("");
    setEditingId(null);
  }

  /* -------- NEW CLIENT -------- */
  function addNewClient() {
    resetForm();
    const nextNumber = clients.length + 1;
    const code = `CUST${nextNumber.toString().padStart(3, "0")}`;
    setCustomerCode(code);
    setShowForm(true);
  }

  /* -------- SAVE / UPDATE -------- */
async function saveClient() {
  if (!customerName || !phoneNumber || !place) return alert("Fill all");

  if (editingId) {
    await fetch(`http://localhost:4000/clients/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, phoneNumber, place }),
    });
  } else {
    await fetch("http://localhost:4000/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerCode, customerName, phoneNumber, place }),
    });
  }

  await loadClients();   // ✅ ALWAYS ARRAY
  setShowForm(false);
  resetForm();
}


  /* -------- EDIT -------- */
  function editClient(client: ClientEntry) {
    setEditingId(client.id);
    setCustomerCode(client.customerCode);
    setCustomerName(client.customerName);
    setPhoneNumber(client.phoneNumber);
    setPlace(client.place);
    setShowForm(true);
  }

 async function deleteClient(id: string) {
  if (!confirm("Delete?")) return;

  await fetch(`http://localhost:4000/clients/${id}`, { method: "DELETE" });

  setClients(prev => prev.filter(c => c.id !== id));
}


  const filteredClients = clients.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phoneNumber.includes(searchTerm) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#fefefe] p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-red-800">Client Register</h1>
        <button
          onClick={addNewClient}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          New Client
        </button>
        <button
  onClick={exportToExcel}
  className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
>
  Export Excel
</button>

      </div>

      <input
        type="text"
        placeholder="Search by code, name or phone..."
        className="border px-2 py-1 rounded mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {showForm && (
        <div className="border p-4 rounded mb-4 bg-white shadow">
          <div className="flex flex-col gap-2 mb-2">
            <label>Customer Code:</label>
            <input
              className="border px-2 py-1 rounded bg-gray-100"
              value={customerCode}
              readOnly
            />
          </div>

          <div className="flex flex-col gap-2 mb-2">
            <label>Customer Name:</label>
            <input
              className="border px-2 py-1 rounded"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 mb-2">
            <label>Phone Number:</label>
            <input
              className="border px-2 py-1 rounded"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label>Place:</label>
            <input
              className="border px-2 py-1 rounded"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveClient}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {editingId ? "Update" : "Save"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className="w-full border-collapse bg-white">
        <thead className="bg-amber-100 border-b-2 border-red-700">
          <tr>
            <th className="border px-2 py-2">Sr No.</th>
            <th className="border px-2 py-2">Customer Code</th>
            <th className="border px-2 py-2">Customer Name</th>
            <th className="border px-2 py-2">Phone Number</th>
            <th className="border px-2 py-2">Place</th>
            <th className="border px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.length > 0 ? (
            filteredClients.map((c, index) => (
              <tr key={c.id} className="hover:bg-yellow-50">
                <td className="border px-2 py-1 text-center">{index + 1}</td>
                <td className="border px-2 py-1 text-center">
                  {c.customerCode}
                </td>
                <td className="border px-2 py-1">{c.customerName}</td>
                <td className="border px-2 py-1">{c.phoneNumber}</td>
                <td className="border px-2 py-1">{c.place}</td>
                <td className="border px-2 py-1 text-center">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => editClient(c)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteClient(c.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4 text-gray-500">
                No clients found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

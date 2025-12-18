import { useEffect, useState } from "react";
import { Trash2, Edit } from "lucide-react";
import * as XLSX from "xlsx";


interface Material {
  id: string;
  materialCode: string;
  materialName: string;
  description: string;
  color: string;
}

export default function MaterialRegister() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [materialCode, setMaterialCode] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");


function exportMaterialsToExcel() {
  const data = materials.map((m, index) => ({
    "Sr No": index + 1,
    "Material Code": m.materialCode,
    "Material Name": m.materialName,
    Color: m.color,
    Description: m.description,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Materials");

  XLSX.writeFile(workbook, "materials.xlsx");
}



  /* LOAD */
  async function loadMaterials() {
    const res = await fetch("http://localhost:4000/materials");
    const data = await res.json();

    setMaterials(
      Array.isArray(data)
        ? data.map((m: any) => ({
            id: m.id,
            materialCode: m.material_code,
            materialName: m.material_name,
            description: m.description,
            color: m.color,
          }))
        : []
    );
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  function resetForm() {
    setMaterialCode("");
    setMaterialName("");
    setDescription("");
    setColor("");
    setEditingId(null);
  }

  function addNewMaterial() {
    resetForm();
    const code = `MAT${(materials.length + 1)
      .toString()
      .padStart(3, "0")}`;
    setMaterialCode(code);
    setShowForm(true);
  }

  async function saveMaterial() {
    if (!materialName || !color) {
      alert("Please fill required fields");
      return;
    }

    if (editingId) {
      await fetch(`http://localhost:4000/materials/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialName, description, color }),
      });
    } else {
      await fetch("http://localhost:4000/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialCode,
          materialName,
          description,
          color,
        }),
      });
    }

    await loadMaterials();
    setShowForm(false);
    resetForm();
  }

  async function deleteMaterial(id: string) {
    if (!confirm("Delete this material?")) return;
    await fetch(`http://localhost:4000/materials/${id}`, {
      method: "DELETE",
    });
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  function editMaterial(m: Material) {
    setEditingId(m.id);
    setMaterialCode(m.materialCode);
    setMaterialName(m.materialName);
    setDescription(m.description);
    setColor(m.color);
    setShowForm(true);
  }

  const filteredMaterials = materials.filter(
    (m) =>
      m.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#fefefe] p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-red-800">Material Register</h1>
        <button
          onClick={addNewMaterial}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          New Material
        </button>
        <button
  onClick={exportMaterialsToExcel}
  className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
>
  Export Excel
</button>

      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by code, name or color..."
        className="border px-3 py-2 rounded mb-4 w-full"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Form */}
      {showForm && (
        <div className="border p-4 rounded mb-4 bg-white shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Material Code</label>
              <input
                className="border px-2 py-1 rounded w-full bg-gray-100"
                value={materialCode}
                readOnly
              />
            </div>

            <div>
              <label className="font-medium">Material Name *</label>
              <input
                className="border px-2 py-1 rounded w-full"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
              />
            </div>

            <div>
              <label className="font-medium">Color *</label>
              <input
                className="border px-2 py-1 rounded w-full"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            <div>
              <label className="font-medium">Description</label>
              <input
                className="border px-2 py-1 rounded w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={saveMaterial}
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

      {/* Table */}
      <table className="w-full border-collapse bg-white">
        <thead className="bg-amber-100 border-b-2 border-red-700">
          <tr>
            <th className="border px-2 py-2">Sr No.</th>
            <th className="border px-2 py-2">Material Code</th>
            <th className="border px-2 py-2">Material Name</th>
            <th className="border px-2 py-2">Color</th>
            <th className="border px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((m, index) => (
              <tr key={m.id} className="hover:bg-yellow-50">
                <td className="border px-2 py-1 text-center">
                  {index + 1}
                </td>
                <td className="border px-2 py-1 text-center">
                  {m.materialCode}
                </td>
                <td className="border px-2 py-1">{m.materialName}</td>
                <td className="border px-2 py-1">{m.color}</td>
                <td className="border px-2 py-1 text-center">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => editMaterial(m)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteMaterial(m.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="text-center py-4 text-gray-500"
              >
                No materials found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

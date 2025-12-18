import { useState, useEffect } from "react";
import { Trash2, Edit } from "lucide-react";

interface ProductEntry {
  id: string;
  productCode: string;
  productName: string;
  description: string;
  colorCode: string;
  quantity: string;
}

export default function ProductRegister() {
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [quantity, setQuantity] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  /* Load from localStorage */
  useEffect(() => {
    const saved = localStorage.getItem("products");
    if (saved) setProducts(JSON.parse(saved));
    setLoaded(true);
  }, []);

  /* Save to localStorage */
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("products", JSON.stringify(products));
  }, [products, loaded]);

  function resetForm() {
    setProductCode("");
    setProductName("");
    setDescription("");
    setColorCode("");
    setQuantity("");
    setEditingId(null);
  }

  function addNewProduct() {
    resetForm();
    setShowForm(true);
  }

  function saveProduct() {
    if (!productCode || !productName || !quantity) {
      alert("Please fill all required fields");
      return;
    }

    if (editingId) {
      // UPDATE
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                productCode,
                productName,
                description,
                colorCode,
                quantity,
              }
            : p
        )
      );
    } else {
      // CREATE
      const newEntry: ProductEntry = {
        id: crypto.randomUUID(),
        productCode,
        productName,
        description,
        colorCode,
        quantity,
      };
      setProducts((prev) => [newEntry, ...prev]);
    }

    setShowForm(false);
    resetForm();
  }

  function editProduct(product: ProductEntry) {
    setEditingId(product.id);
    setProductCode(product.productCode);
    setProductName(product.productName);
    setDescription(product.description);
    setColorCode(product.colorCode);
    setQuantity(product.quantity);
    setShowForm(true);
  }

  function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const filteredProducts = products.filter(
    (p) =>
      p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#fefefe] p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-red-800">Product Register</h1>
        <button
          onClick={addNewProduct}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          New Product
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by product code or name..."
        className="border px-2 py-1 rounded mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {showForm && (
        <div className="border p-4 rounded mb-4 bg-white shadow">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Product Code"
              className="border px-2 py-1 rounded"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
            />
            <input
              placeholder="Product Name"
              className="border px-2 py-1 rounded"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <input
              placeholder="Description"
              className="border px-2 py-1 rounded"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              placeholder="Color Code"
              className="border px-2 py-1 rounded"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
            />
            <input
              type="number"
              placeholder="Quantity"
              className="border px-2 py-1 rounded"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveProduct}
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
            <th className="border px-2 py-2">Code</th>
            <th className="border px-2 py-2">Name</th>
            <th className="border px-2 py-2">Description</th>
            <th className="border px-2 py-2">Color</th>
            <th className="border px-2 py-2">Qty</th>
            <th className="border px-2 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p, index) => (
              <tr key={p.id} className="hover:bg-yellow-50">
                <td className="border px-2 py-1 text-center">{index + 1}</td>
                <td className="border px-2 py-1">{p.productCode}</td>
                <td className="border px-2 py-1">{p.productName}</td>
                <td className="border px-2 py-1">{p.description}</td>
                <td className="border px-2 py-1">{p.colorCode}</td>
                <td className="border px-2 py-1">{p.quantity}</td>
                <td className="border px-2 py-1 text-center">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => editProduct(p)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-4 text-gray-500">
                No products found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

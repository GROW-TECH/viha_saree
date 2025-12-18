import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

/* ---------- INTERFACES ---------- */
interface Order {
  id: string;
  order_date: string;
  customer_name: string;
  salary: number;
  status: string;
  product_count: number;
}

/* ---------- COMPONENT ---------- */
export default function CompletedOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [qrImages, setQrImages] = useState<string[]>([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const res = await fetch("http://localhost:4000/orders/completed");
    setOrders(await res.json());
  }

  /* ---------- FILTER ---------- */
  const filteredOrders = orders.filter(o => {
    const oDate = new Date(o.order_date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);
    return (!from || oDate >= from) && (!to || oDate <= to);
  });

  /* ---------- EXPORT ---------- */
  function exportCompletedOrders() {
    const data = filteredOrders.map((o, index) => ({
      "Sr No": index + 1,
      Date: o.order_date,
      Customer: o.customer_name,
      Salary: o.salary,
      Sarees: o.product_count,
      Status: o.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Completed Orders");
    XLSX.writeFile(wb, "completed_orders.xlsx");
  }

  /* ---------- GENERATE ALL SAREE QRs ---------- */
  async function generateQR(orderId: string) {
    const res = await fetch(
      `http://localhost:4000/orders/${orderId}/saree-qr`
    );
    const data = await res.json();
    setQrImages(data.qrs || []);
  }

  /* ---------- PRINT ---------- */
function printQR() {
  if (qrImages.length === 0) return;

  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Print Saree QRs</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            margin: 0;
            display: grid;
            grid-template-columns: repeat(4, 1fr); /* 🔁 change to 6 if needed */
            gap: 10mm;
            justify-items: center;

            /* 👇 IMPORTANT FIX */
            align-items: start;
            align-content: start;
          }

          .qr-box {
            width: 35mm;
            height: 35mm;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        ${qrImages
          .map(qr => `<div class="qr-box"><img src="${qr}" /></div>`)
          .join("")}
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  win.document.close();
}





  /* ---------- UI ---------- */
  return (
    <div className="p-4 bg-white h-full">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-800">
          Completed Orders
        </h1>
        <button
          onClick={exportCompletedOrders}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <button onClick={() => { setFromDate(""); setToDate(""); }}>
          Clear
        </button>
      </div>

      <table className="w-full border">
        <thead className="bg-amber-100">
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Sarees</th>
            <th>Status</th>
            <th>QR</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(o => (
            <tr key={o.id}>
              <td>{o.order_date}</td>
              <td>{o.customer_name}</td>
              <td>{o.product_count}</td>
              <td>{o.status}</td>
              <td>
                <button
                  onClick={() => generateQR(o.id)}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                >
                  Generate QR
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {qrImages.length > 0 && (
        <div className="mt-6 border p-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {qrImages.map((qr, i) => (
              <img key={i} src={qr} className="w-32" />
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <button onClick={printQR} className="bg-green-600 text-white px-4 py-1">
              Print All
            </button>
            <button onClick={() => setQrImages([])} className="bg-red-600 text-white px-4 py-1">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

  import express from "express";
  import cors from "cors";
  import clientRoutes from "./routes/client.js";
  import materialRoutes from "./routes/materials.js";
  import OrderRoutes from "./routes/order.js";
  import purchasesRoutes from "./routes/purchases.js";

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/clients", clientRoutes);
  app.use("/materials", materialRoutes);
  app.use("/orders", OrderRoutes);
  app.use("/api/purchases", purchasesRoutes);



  app.listen(4000, () => {
    console.log("Server running on port 4000");
  });

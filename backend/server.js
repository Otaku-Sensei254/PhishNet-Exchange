import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
//import checkRoutes from "./routes/check.js";
import LeakRouts from "./routes/leakcher.js";
import leakCheckRoutes from "./routes/leak.js";
import scanRoutes from "./routes/ScanRoutes.js";
import linkScannerRoutes from "./routes/linkScan.js";
import paystackRoutes from "./routes/paystack.routes.js";
import Payments from "./routes/payment.routes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
//import leakRoutes from "./routes/leak.js";
import threatRoutes from "./routes/threat.routes.js";
import iocRoutes from "./routes/iocRoutes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error", err));


app.use("/api/auth", authRoutes);
//app.use("/api/check", checkRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api", LeakRouts);
app.use("/api/check", leakCheckRoutes);
app.use("/api/link", linkScannerRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/payment", Payments);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/threats", threatRoutes);
app.use("/api/iocs", iocRoutes);
//app.use("/api/leak", leakRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

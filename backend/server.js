import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import LeakRouts from "./routes/leakcher.js";
import leakCheckRoutes from "./routes/leak.js";
import scanRoutes from "./routes/ScanRoutes.js";
import linkScannerRoutes from "./routes/linkScan.js";
import paystackRoutes from "./routes/paystack.routes.js";
import Payments from "./routes/payment.routes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
import threatRoutes from "./routes/threat.routes.js";
import iocRoutes from "./routes/iocRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import { scrapeReports } from "./services/scamBuster.js";

dotenv.config();

const app = express();

// CORS
const allowedOrigins = [
  'https://phish-net-exchange-mk2.vercel.app',
  process.env.FRONTEND_URL?.replace(/\/$/, ''),
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('chrome-extension://')
    ) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api", LeakRouts);
app.use("/api/check", leakCheckRoutes);
app.use("/api/link", linkScannerRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/payment", Payments);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/threats", threatRoutes);
app.use("/api/iocs", iocRoutes);
app.use("/api/teams", teamRoutes);

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('Not allowed by CORS')) {
    console.error(`[CORS] Rejected: ${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
    return res.status(403).json({ error: err.message });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;

// Warm up ScamBuster cache before accepting requests
try {
  const reports = await scrapeReports();
  console.log(`ScamBuster cache warmed: ${reports.length} reports`);
} catch (e) {
  console.error("ScamBuster warmup failed:", e.message);
}
// Periodic refresh (every 6 hours)
setInterval(() => scrapeReports().catch(() => {}), 6 * 60 * 60 * 1000);

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
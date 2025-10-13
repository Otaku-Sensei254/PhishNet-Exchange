import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "neondb_owner",
  password: "npg_6HVwkgAi4qOo",
  host: "ep-tight-fog-a8ow4xhv-pooler.eastus2.azure.neon.tech",
  database: "neondb",
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Neon allows self-signed certs
  },
   idleTimeoutMillis: 30000, // 30s before idle client disconnect
  connectionTimeoutMillis: 10000, // 10s connect timeout
});

pool.on("connect", () => {
  console.log("✅ Connected to Neon database with SSL");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;

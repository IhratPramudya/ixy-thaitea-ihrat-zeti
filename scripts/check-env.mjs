// Hanya berjalan di Vercel. Di laptop dilewati.
if (!process.env.VERCEL) process.exit(0);

const required = ["DATABASE_URL", "DIRECT_URL"];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error("\n❌ Environment variable belum diisi di Vercel: " + missing.join(", "));
  console.error("Buka Vercel → Project → Settings → Environment Variables, isi, lalu Redeploy.\n");
  process.exit(1);
}
console.log("✅ Environment variable lengkap");


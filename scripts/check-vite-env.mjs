import { loadEnv } from "vite";

const mode = process.env.NODE_ENV === "development" ? "development" : "production";
const fromFile = loadEnv(mode, process.cwd(), "VITE_");

const url = process.env.VITE_SUPABASE_URL ?? fromFile.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY ?? fromFile.VITE_SUPABASE_ANON_KEY;

const invalid =
  !url ||
  !key ||
  url === "https://SEU-PROJETO.supabase.co" ||
  url.includes("SEU-PROJETO") ||
  key === "sua-anon-key-aqui-teste";

if (invalid) {
  console.error("❌ VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias para o build.\n");
  console.error("Local: cp .env.example → .env.local e preencha URL + anon key.\n");
  console.error("Cloudflare Workers Builds → Settings → Build:");
  console.error("  Build command: npm ci && npm run build");
  console.error("  Build variables (não só runtime): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY");
  console.error("  Depois de salvar, faça um novo deploy.\n");
  process.exit(1);
}

console.log("✓ VITE_SUPABASE_* presentes para o build.");

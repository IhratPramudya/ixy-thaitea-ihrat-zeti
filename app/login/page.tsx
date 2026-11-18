"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error || !res?.ok) { setLoading(false); setErr("Email atau password salah."); return; }
    window.location.href = "/admin";
  }

  const input = "w-full rounded-2xl border border-chai-100 bg-white px-4 py-3 outline-none focus:border-chai-500 focus:ring-2 focus:ring-chai-400/30";
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-3xl bg-white p-6 shadow-lg shadow-chai-500/10">
        <p className="text-4xl">🧋</p>
        <h1 className="text-2xl font-extrabold">Login Admin</h1>
        <p className="text-sm text-chai-800/60">ixy Thai Tea · dashboard penjual</p>
        <input className={input} type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={input} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-chai-500 to-chai-600 py-3 font-bold text-white disabled:opacity-60">{loading ? "Masuk..." : "Masuk"}</button>
      </form>
    </main>
  );
}

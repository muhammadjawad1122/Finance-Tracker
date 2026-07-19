import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/70 border border-slate-700 p-6 text-white">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-slate-300 mt-1">Login to continue</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/15 border border-red-500/40 p-3 text-sm">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="Your password"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-3 py-2 font-medium"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          New here?{" "}
          <Link className="text-sky-400 hover:underline" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
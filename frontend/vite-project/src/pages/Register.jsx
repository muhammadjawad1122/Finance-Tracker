import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/70 border border-slate-700 p-6 text-white">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-slate-300 mt-1">Personal Finance Tracker</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/15 border border-red-500/40 p-3 text-sm">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-slate-300">Name</label>
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-sky-500"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Your name"
              required
            />
          </div>

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
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-3 py-2 font-medium"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          Already have an account?{" "}
          <Link className="text-sky-400 hover:underline" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    [
      "px-3 py-2 rounded-xl border transition",
      isActive
        ? "bg-slate-800/70 border-slate-700/60 text-white"
        : "bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-slate-900/40 hover:border-slate-800/60",
    ].join(" ");

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="font-extrabold tracking-wide">
            Finance <span className="text-sky-300">Tracker</span>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/transactions" className={linkClass}>
              Transactions
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right leading-tight">
            <div className="font-semibold">{user?.name || "User"}</div>
            <div className="text-xs text-slate-400">
              {user?.email || ""} {user?.currency ? `• ${user.currency}` : ""}
            </div>
          </div>

          <button className="btn" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
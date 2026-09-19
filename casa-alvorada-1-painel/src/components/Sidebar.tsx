import { NavLink } from "react-router-dom";
import { supabase } from "../lib/supabase";

const items = [
  {
    to: "/",
    label: "Painel",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10 10 3l7 7" /><path d="M5 8.5V17h10V8.5" /></svg>
    ),
  },
  {
    to: "/lancamentos",
    label: "Lançamentos",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="3" width="12" height="14" rx="1.5" /><path d="M7 7.5h6M7 10.5h6M7 13.5h3.5" /></svg>
    ),
  },
  {
    to: "/socios",
    label: "Sócios",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="7.3" cy="7" r="2.3" /><circle cx="13.2" cy="8.3" r="1.9" /><path d="M2.8 16c.4-2.8 2.2-4.3 4.5-4.3s4 1.5 4.5 4.3" /><path d="M11.8 12.4c1.9 0 3.4 1.3 3.8 3.6" /></svg>
    ),
  },
  {
    to: "/lotes",
    label: "Lotes & Obra",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="8" width="5.5" height="9" /><rect x="11" y="3" width="5.5" height="14" /><path d="M13 6.5h1.5M13 9.5h1.5M13 12.5h1.5" /></svg>
    ),
  },
  {
    to: "/config",
    label: "Configurações",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3v6M6 12v5M10 3v3M10 9v8M14 3v9M14 15v2" /><circle cx="6" cy="10" r="1.7" fill="currentColor" stroke="none" /><circle cx="10" cy="6.5" r="1.7" fill="currentColor" stroke="none" /><circle cx="14" cy="12.5" r="1.7" fill="currentColor" stroke="none" /></svg>
    ),
    adminOnly: true,
  },
];

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">CA</div>
        <div className="txt"><b>Casa Alvorada 1</b><span>SPE</span></div>
      </div>
      <nav className="nav">
        {items
          .filter((it) => !it.adminOnly || isAdmin)
          .map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/"}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              {it.icon}
              <span className="lbl">{it.label}</span>
            </NavLink>
          ))}
      </nav>
      <div className="nav-foot">
        <button className="nav-item" onClick={() => supabase.auth.signOut()}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8" /><path d="M13 6l4 4-4 4" /><path d="M17 10H7.5" /></svg>
          <span className="lbl">Sair</span>
        </button>
      </div>
    </aside>
  );
}

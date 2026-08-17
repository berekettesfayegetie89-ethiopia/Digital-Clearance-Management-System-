import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { NAV_BY_ROLE, ROLE_LABELS } from "../../data/navigation";
import { useBranding } from "../../context/BrandingContext";

const COLLAPSE_KEY = "clearance_sidebar_collapsed";

export default function Sidebar({ role, open, onClose }) {
  const { institution_name, logoUrl, t } = useBranding();
  const items = NAV_BY_ROLE[role] || [];
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, !c ? "1" : "0");
      return !c;
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-border bg-surface transition-all duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20" : "w-72"}`}
      >
        <div className={`flex items-center gap-3 border-b border-border py-5 ${collapsed ? "justify-center px-2" : "px-6"}`}>
          <img src={logoUrl} alt={`${institution_name} logo`} className="h-10 w-10 shrink-0 rounded-md object-contain" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold leading-tight text-primary">Digital Clearance</p>
              <p className="truncate text-xs leading-tight text-text-secondary">{institution_name}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === items[0].path}
              onClick={onClose}
              title={collapsed ? t(label) : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-primary/8 text-primary"
                    : "text-text-secondary hover:bg-canvas hover:text-text-primary"
                }`
              }
            >
              <Icon size={20} strokeWidth={1.9} className="shrink-0" />
              {!collapsed && <span className="truncate">{t(label)}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleCollapsed}
          className="hidden items-center justify-center gap-2 border-t border-border py-3 text-xs font-medium text-text-secondary transition hover:bg-canvas hover:text-text-primary lg:flex"
        >
          {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
        </button>

        {!collapsed && (
          <div className="border-t border-border px-4 py-4">
            <p className="px-2 text-xs text-text-secondary">
              Signed in as <span className="font-medium text-text-primary">{ROLE_LABELS[role]}</span>
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

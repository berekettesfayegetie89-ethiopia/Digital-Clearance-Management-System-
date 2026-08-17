import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, FileText, User, Award, Loader2 } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import ThemeToggle from "../common/ThemeToggle";
import { searchService } from "../../services/searchService";
import { useBranding } from "../../context/BrandingContext";

export default function TopNav({ onMenuClick, notificationsPath, profilePath, requestsPath, notificationCount = 0 }) {
  const { t } = useBranding();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      searchService
        .query(query.trim())
        .then(({ results }) => setResults(results))
        .catch(() => setResults(null))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const hasResults = results && (results.requests?.length || results.users?.length || results.certificates?.length);

  const goToRequest = (r) => {
    setOpen(false);
    setQuery("");
    navigate(requestsPath || "/", { state: { highlightRequestId: r.id } });
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-text-secondary hover:bg-canvas lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      <span className="hidden text-sm font-semibold text-primary lg:block">Wollo University</span>

      <div className="ml-auto flex flex-1 items-center justify-end gap-3 sm:flex-initial sm:min-w-[320px]">
        <div className="relative hidden flex-1 sm:block" ref={boxRef}>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={t("Search reference no., applicant, certificate...")}
            className="w-full rounded-lg border border-border bg-canvas py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
          />
          {open && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-card border border-border bg-surface shadow-modal">
              {searching ? (
                <div className="flex items-center gap-2 px-4 py-4 text-sm text-text-secondary">
                  <Loader2 size={14} className="animate-spin" /> Searching...
                </div>
              ) : !hasResults ? (
                <p className="px-4 py-4 text-sm text-text-secondary">No results for "{query}"</p>
              ) : (
                <div className="py-2">
                  {results.requests?.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Clearance Requests</p>
                      {results.requests.map((r) => (
                        <button key={r.id} onClick={() => goToRequest(r)} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-canvas">
                          <FileText size={14} className="text-text-secondary" />
                          <span className="font-medium text-text-primary">{r.reference_no}</span>
                          <span className="text-text-secondary">· {r.applicant?.full_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.users?.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Users</p>
                      {results.users.map((u) => (
                        <div key={u.id} className="flex items-center gap-2.5 px-4 py-2 text-sm">
                          <User size={14} className="text-text-secondary" />
                          <span className="font-medium text-text-primary">{u.full_name}</span>
                          <span className="text-text-secondary">· {u.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {results.certificates?.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Certificates</p>
                      {results.certificates.map((c) => (
                        <div key={c.id} className="flex items-center gap-2.5 px-4 py-2 text-sm">
                          <Award size={14} className="text-text-secondary" />
                          <span className="font-medium text-text-primary">{c.certificate_number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate(notificationsPath)}
          className="relative rounded-md p-2 text-text-secondary hover:bg-canvas"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
          )}
        </button>

        <ThemeToggle />

        <ProfileDropdown profilePath={profilePath} />
      </div>
    </header>
  );
}

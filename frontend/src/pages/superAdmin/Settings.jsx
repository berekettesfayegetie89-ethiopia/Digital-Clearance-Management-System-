import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useToast } from "../../context/ToastContext";
import { settingsService } from "../../services/settingsService";
import { useBranding } from "../../context/BrandingContext";

const TABS = ["General", "Email (SMTP)", "Certificate", "Security", "Appearance", "Language", "Time Zone"];

export default function Settings() {
  const { showToast } = useToast();
  const { refresh: refreshBranding } = useBranding();
  const [tab, setTab] = useState(TABS[0]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const load = () => {
    setLoading(true);
    settingsService
      .get()
      .then(({ settings }) => { setSettings(settings); setDraft(settings); })
      .catch((err) => showToast(err.message || "Failed to load settings", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const field = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const { settings } = await settingsService.update(draft);
      setSettings(settings);
      refreshBranding(); // institution name change (if any) shows up in the sidebar/login/verify pages instantly
      showToast(`${tab} settings saved`, "success");
    } catch (err) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { settings } = await settingsService.uploadLogo(file);
      setSettings(settings);
      setDraft((d) => ({ ...d, logo_path: settings.logo_path }));
      refreshBranding(); // new logo shows up in the sidebar/login/verify pages instantly
      showToast("Logo uploaded", "success");
    } catch (err) {
      showToast(err.message || "Logo upload failed", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <p className="text-sm text-text-secondary">Loading real settings from the database...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Changes here are saved to the database and persist across refreshes." />

      <div className="mb-5 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="max-w-2xl">
        {tab === "General" && (
          <div className="space-y-4">
            <Field label="Institution Name" value={draft.institution_name} onChange={(v) => field("institution_name", v)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Logo</label>
              <div className="flex items-center gap-3">
                {settings.logo_path ? (
                  <img src={settingsService.logoUrl(settings.logo_path)} alt="Institution logo" className="h-14 w-14 rounded-lg border border-border object-contain" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-canvas text-[10px] text-text-secondary">LOGO</div>
                )}
                <label className="cursor-pointer">
                  <span className="inline-flex items-center rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-primary hover:bg-canvas">
                    {uploadingLogo ? "Uploading..." : "Upload New Logo"}
                  </span>
                  <input type="file" accept=".png,.jpg,.jpeg,.svg" hidden onChange={handleLogoUpload} disabled={uploadingLogo} />
                </label>
              </div>
            </div>
          </div>
        )}

        {tab === "Email (SMTP)" && (
          <div className="space-y-4">
            <Field label="SMTP Host" value={draft.smtp_host} onChange={(v) => field("smtp_host", v)} placeholder="smtp.gmail.com" />
            <Field label="Port" value={draft.smtp_port} onChange={(v) => field("smtp_port", Number(v))} placeholder="587" />
            <Field label="Username" value={draft.smtp_user} onChange={(v) => field("smtp_user", v)} placeholder="you@gmail.com" />
            <p className="text-xs text-text-secondary">
              SMTP password is set in the backend's <code className="rounded bg-canvas px-1 py-0.5">.env</code> file (SMTP_PASSWORD), not stored here, for security. For Gmail, use an App Password, not your regular password.
            </p>
          </div>
        )}

        {tab === "Certificate" && (
          <div className="space-y-4">
            <Field label="Watermark Text" value={draft.certificate_watermark_text} onChange={(v) => field("certificate_watermark_text", v)} />
            <Field label="Verification Window (years)" value={draft.certificate_verification_years} onChange={(v) => field("certificate_verification_years", Number(v))} type="number" />
          </div>
        )}

        {tab === "Security" && (
          <div className="space-y-4">
            <Field label="Minimum Password Length" value={draft.min_password_length} onChange={(v) => field("min_password_length", Number(v))} type="number" />
            <Field label="Session Timeout (minutes)" value={draft.session_timeout_minutes} onChange={(v) => field("session_timeout_minutes", Number(v))} type="number" />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={!!draft.require_2fa_for_admins}
                onChange={(e) => field("require_2fa_for_admins", e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              Require 2FA for Admin roles
            </label>
          </div>
        )}

        {tab === "Appearance" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary" title="Primary" />
              <div className="h-10 w-10 rounded-lg bg-secondary" title="Secondary" />
              <div className="h-10 w-10 rounded-lg bg-accent" title="Accent" />
            </div>
            <p className="text-xs text-text-secondary">Brand colors are fixed per the institution's design system.</p>
          </div>
        )}

        {tab === "Language" && (
          <select
            value={draft.language}
            onChange={(e) => field("language", e.target.value)}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ (Amharic)</option>
          </select>
        )}

        {tab === "Time Zone" && (
          <Field label="Time Zone" value={draft.time_zone} onChange={(v) => field("time_zone", v)} />
        )}

        <Button className="mt-6" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text-primary">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}

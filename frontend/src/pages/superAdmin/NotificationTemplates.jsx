import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useToast } from "../../context/ToastContext";
import { templatesService } from "../../services/templatesService";

export default function NotificationTemplates() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    templatesService
      .list()
      .then(({ templates }) => {
        setTemplates(templates);
        if (templates.length > 0) {
          setActiveId(templates[0].id);
          setSubject(templates[0].subject);
          setBody(templates[0].body);
        }
      })
      .catch((err) => showToast(err.message || "Failed to load templates", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const active = templates.find((t) => t.id === activeId);

  const selectTemplate = (t) => {
    setActiveId(t.id);
    setSubject(t.subject);
    setBody(t.body);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { template } = await templatesService.update(activeId, { subject, body });
      setTemplates((ts) => ts.map((t) => (t.id === activeId ? template : t)));
      showToast("Template saved", "success");
    } catch (err) {
      showToast(err.message || "Failed to save template", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Notification Templates" />
        <p className="text-sm text-text-secondary">Loading real templates...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Notification Templates" description="These are the real templates the backend's email service uses when sending notifications." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <div className="space-y-1">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${activeId === t.id ? "bg-primary/8 text-primary" : "text-text-secondary hover:bg-canvas"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <p className="mb-4 text-sm font-semibold text-text-primary">{active?.label}</p>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-4 w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Body</label>
          <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["{applicant_name}", "{reference_no}", "{department}", "{certificate_no}", "{clearance_type}", "{reason}"].map((v) => (
              <span key={v} className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-mono text-text-secondary">{v}</span>
            ))}
          </div>
          <Button className="mt-4" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Template"}</Button>
        </Card>
      </div>
    </div>
  );
}

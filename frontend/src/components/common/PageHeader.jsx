export default function PageHeader({ title, description, actions, meta }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        {meta && <div className="mt-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

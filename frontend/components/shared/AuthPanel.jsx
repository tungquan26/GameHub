export default function AuthPanel({ title, subtitle, children }) {
  return <section className="dp-panel p-6 sm:p-9">
    <h1 className="text-3xl font-semibold tracking-tight uppercase">{title}</h1>
    {subtitle && <div className="mt-3 text-sm leading-6 text-dp-read">{subtitle}</div>}
    <div className="mt-8">{children}</div>
  </section>;
}

export function FormMessage({ error, notice }) {
  return <>{error && <p role="alert" className="text-sm leading-6 text-red-400">{error}</p>}
    {notice && <p role="status" className="text-sm leading-6 text-dp-live">{notice}</p>}</>;
}

import { Link } from "react-router-dom";

export default function PageHeader({ title, description, breadcrumbs, actions }) {
  return <header className="mb-7 sm:mb-8">
    {breadcrumbs && <nav aria-label="Đường dẫn" className="mb-6 text-xs text-dp-meta"><ol className="flex flex-wrap items-center gap-2">
      {breadcrumbs.map((item, index) => <li key={item.label} className="flex items-center gap-2">
        {index > 0 && <span aria-hidden="true">/</span>}
        {item.to ? <Link to={item.to} className="hover:text-dp-bright">{item.label}</Link> : <span aria-current="page">{item.label}</span>}
      </li>)}
    </ol></nav>}
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight uppercase sm:text-4xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-sm leading-7 text-dp-read">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  </header>;
}

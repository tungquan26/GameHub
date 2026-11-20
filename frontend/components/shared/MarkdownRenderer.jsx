import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ImageWithFallback from "./ImageWithFallback";

export default function MarkdownRenderer({ value, emptyMessage = "Chưa cập nhật điều lệ giải đấu." }) {
  return <div className="markdown-body text-sm leading-7 text-dp-read">
    {value.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml
      components={{
        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        table: ({ node, ...props }) => <div role="region" aria-label="Bảng nội dung" tabIndex={0} className="max-w-full overflow-x-auto"><table {...props} /></div>,
        img: ({ node, ...props }) => <ImageWithFallback {...props} loading="lazy" className="max-w-full rounded-panel" />,
      }}>{value}</ReactMarkdown>
      : <p className="italic text-dp-meta">{emptyMessage}</p>}
  </div>;
}

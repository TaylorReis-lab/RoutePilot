import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { CopyButton } from "./CopyButton";
import { cn } from "../utils/cn";

const components: Partial<Components> = {
  pre: ({ children }) => <>{children}</>,
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const raw = String(children ?? "").replace(/\n$/, "");
    if (match) {
      return (
        <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0b1020]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {match[1]}
            </span>
            <CopyButton text={raw} />
          </div>
          <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed">
            <code className={className}>{raw}</code>
          </pre>
        </div>
      );
    }
    return (
      <code
        className={cn(
          "rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.86em] text-violet-200",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  a({ children, href, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
        {...props}
      >
        {children}
      </a>
    );
  },
  h1: ({ children }) => (
    <h1 className="mb-3 mt-5 text-xl font-semibold text-slate-50 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-lg font-semibold text-slate-50 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-slate-50 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => <h4 className="mb-1 mt-3 font-semibold text-slate-50">{children}</h4>,
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="marker:text-slate-500">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-violet-400/60 pl-4 text-slate-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-white/10" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/10 bg-white/5 px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-white/5 px-3 py-2 align-top">{children}</td>,
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className="text-[15px] text-slate-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

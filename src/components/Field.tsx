import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export const inputClass =
  "w-full min-w-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20";

export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span className="truncate">
          {label}
          {required && (
            <span className="ml-1 font-bold text-rose-400" title="Campo obrigatório">
              *
            </span>
          )}
        </span>
        {hint && (
          <span className="shrink-0 font-normal normal-case tracking-normal text-slate-500">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export function Card({
  title,
  icon,
  description,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-2.5">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

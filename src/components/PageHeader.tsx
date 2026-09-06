import { ReactNode } from 'react';

export default function PageHeader({ title, kicker, children }: { title: string; kicker?: string; children?: ReactNode }) {
  return (
    <div className="px-5 lg:px-8 pt-8 pb-6 border-b border-border flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <div className="font-mono text-[11px] tracking-widest uppercase text-amber mb-2">{kicker}</div>}
        <h1 className="font-mono text-3xl lg:text-4xl font-bold tracking-tight text-ink">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,246,249,0.9))] p-5 shadow-panel transition hover:-translate-y-1">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-accent/12 blur-2xl transition group-hover:bg-accent/24" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="relative mt-4 text-4xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="relative mt-3 max-w-[22ch] text-sm leading-6 text-slate-500">{detail}</p>
    </article>
  );
}

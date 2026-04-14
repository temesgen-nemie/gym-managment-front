type SectionCardProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionCard({ title, description, headerAction, children }: SectionCardProps) {
  return (
    <section className="min-w-0 rounded-[30px] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,247,249,0.9))] p-6 shadow-panel backdrop-blur">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Module</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-2 max-w-[48ch] text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {children}
    </section>
  );
}

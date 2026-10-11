import { cx } from "./ui";

export function Bone({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-input bg-border/70", className)} />;
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6", className)}>{children}</div>;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="flex gap-4">
        {["w-28", "w-20", "w-16", "w-14"].map((w) => <Bone key={w} className={`h-3 ${w}`} />)}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Bone className="size-8 shrink-0 rounded-full" />
          <Bone className="h-4 flex-1" />
          <Bone className="hidden h-4 w-24 sm:block" />
          <Bone className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Kerangka umum halaman di dalam shell: judul + panel tabel. Dipakai sebagai loading.tsx. */
export function PageSkeleton({ cards = 0 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Memuat halaman">
      <div className="flex flex-col gap-2">
        <Bone className="h-7 w-56" />
        <Bone className="h-4 w-80 max-w-full" />
      </div>
      {cards > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: cards }, (_, i) => (
            <Panel key={i} className="p-4!">
              <Bone className="h-3 w-24" />
              <Bone className="mt-3 h-7 w-16" />
            </Panel>
          ))}
        </div>
      )}
      <Panel>
        <TableSkeleton />
      </Panel>
      <span className="sr-only">Memuat…</span>
    </div>
  );
}

/** Dashboard: form di kiri, riwayat di kanan. */
export function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start" role="status" aria-label="Memuat dashboard">
      <div className="flex flex-col gap-6">
        <Panel>
          <Bone className="h-6 w-40" />
          <Bone className="mt-2 h-4 w-56" />
          <div className="mt-5 flex flex-col gap-3">
            <Bone className="h-11 w-full" />
            <div className="grid grid-cols-2 gap-3"><Bone className="h-11" /><Bone className="h-11" /></div>
            <Bone className="h-12 w-full" />
            <Bone className="h-28 w-full" />
            <Bone className="h-11 w-full" />
          </div>
        </Panel>
        <Panel>
          <Bone className="h-5 w-44" />
          <Bone className="mt-4 h-9 w-28" />
          <Bone className="mt-4 h-2 w-full" />
        </Panel>
      </div>
      <Panel>
        <Bone className="h-6 w-44" />
        <div className="mt-5"><TableSkeleton rows={7} /></div>
      </Panel>
      <span className="sr-only">Memuat…</span>
    </div>
  );
}

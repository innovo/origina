import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/origina/actions";
import { CAMPUSES, ROLE_META } from "@/lib/origina/types";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const q = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const p = q.data;
  const campus = CAMPUSES.find((c) => c.id === p?.campus);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Account</p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">Settings</h1>
      </header>
      {p && (
        <dl className="divide-y divide-line rounded-[22px] border border-line bg-surface">
          <Row k="Name" v={p.fullName} />
          <Row k="Role" v={ROLE_META[p.role].label} />
          <Row k="Campus" v={`${campus?.place ?? ""} · ${campus?.name ?? ""}`} />
          <Row k="Student number" v={p.studentNumber ?? "—"} />
        </dl>
      )}
      <p className="text-sm text-ink-soft">
        Role changes are made by an administrator. Origina is a managed service: hosting, licensing,
        maintenance, patches and 99.9% availability (excluding planned maintenance announced in
        advance) sit with the provider for the three-year subscription from 1 April 2027.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{k}</dt>
      <dd className="text-sm font-medium">{v}</dd>
    </div>
  );
}

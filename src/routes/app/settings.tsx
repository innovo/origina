import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DeleteAccount } from "@/components/delete-account";
import { getProfile } from "@/lib/origina/actions";
import { ROLE_META } from "@/lib/origina/types";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const q = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const p = q.data;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Settings</h1>
      </header>
      {p && (
        <dl className="divide-y divide-line rounded-[22px] border border-line bg-surface">
          <Row k="Name" v={p.fullName} />
          <Row k="Organisation" v={p.orgName ?? "-"} />
          <Row k="Role" v={ROLE_META[p.role].label} />
          <Row k="Campus" v={p.campusName ?? "-"} />
          <Row k="Student number" v={p.studentNumber ?? "-"} />
        </dl>
      )}
      <p className="text-sm text-muted">Your administrator can change your role.</p>
      <DeleteAccount />
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

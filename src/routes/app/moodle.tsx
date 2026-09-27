import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createApiClient, listApiClients } from "@/lib/origina/actions";

export const Route = createFileRoute("/app/moodle")({ component: Moodle });

function Moodle() {
  const qc = useQueryClient();
  const clients = useQuery({ queryKey: ["api-clients"], queryFn: () => listApiClients() });
  const [name, setName] = useState("WCCN Moodle production");
  const [issued, setIssued] = useState<string | null>(null);
  const issue = useMutation({
    mutationFn: () => createApiClient({ data: { name } }),
    onSuccess: async (res) => {
      setIssued(res.token);
      await qc.invalidateQueries({ queryKey: ["api-clients"] });
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Application interface
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">Moodle LMS</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Origina connects over LTI 1.3 and a REST API. Assignments check on upload, similarity
          scores display in Moodle, and the detailed report opens here.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[22px] border border-line bg-surface p-5">
          <h2 className="font-semibold">LTI 1.3 tool</h2>
          <dl className="mt-4 space-y-2 font-mono text-xs text-ink-soft">
            <Row k="Initiate login" v="https://origina.wccn.ac.za/lti/login" />
            <Row k="Redirect URI" v="https://origina.wccn.ac.za/lti/callback" />
            <Row k="JWKS" v="https://origina.wccn.ac.za/.well-known/jwks.json" />
            <Row k="Deployment" v="wccn-moodle-2027" />
          </dl>
          <p className="mt-4 text-sm text-muted">
            Paste these into Site administration → Plugins → Activity modules → Origina. The live
            endpoints activate when the college Moodle tenant is linked.
          </p>
        </article>
        <article className="rounded-[22px] border border-line bg-[#f0ebe3] p-5">
          <div className="rounded-xl bg-[#8e3b2b] px-3 py-2 text-sm text-paper">
            Moodle assignment plugin
          </div>
          <p className="mt-4 text-sm font-medium">Student feedback visibility</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            <li>Show similarity score after due date</li>
            <li>Allow student to open sources, not AI indicator</li>
            <li>Staff always see both scores, separately</li>
          </ul>
          <p className="mt-4 text-sm font-medium">On upload</p>
          <p className="text-sm text-ink-soft">
            Moodle posts the file to Origina, receives a job id, then polls until the report is
            ready. The gradebook column stays empty until academic staff release it.
          </p>
        </article>
      </section>

      <section className="rounded-[22px] border border-line bg-surface p-5">
        <h2 className="font-semibold">REST API client</h2>
        <p className="mt-1 text-sm text-muted">
          POST /api/origina/check with the bearer token. Returns report id and both scores.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            issue.mutate();
          }}
        >
          <div className="flex-1">
            <Label htmlFor="n">Client name</Label>
            <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" className="sm:mt-6" disabled={issue.isPending}>
            Issue key
          </Button>
        </form>
        {issued && (
          <p className="mt-3 break-all rounded-xl bg-ok-soft px-3 py-2 font-mono text-xs text-ok">
            Copy now — {issued}
          </p>
        )}
        <ul className="mt-4 space-y-2 text-sm">
          {(clients.data ?? []).map((c) => (
            <li key={c.id} className="flex justify-between border-t border-line pt-2">
              <span>{c.name}</span>
              <span className="font-mono text-xs text-muted">{c.key_prefix}…</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  createApiClient,
  getProfile,
  listApiClients,
  revokeApiClient,
} from "@/lib/origina/actions";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/api-keys")({ component: ApiPage });

function ApiPage() {
  const qc = useQueryClient();
  const clients = useQuery({ queryKey: ["api-clients"], queryFn: () => listApiClients() });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const defaultName = `${profile.data?.orgShortName ?? "Institution"} integration`;
  const [customName, setName] = useState<string | null>(null);
  const name = customName ?? defaultName;
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const staff = profile.data?.role === "teacher" || profile.data?.role === "admin";

  const issue = useMutation({
    mutationFn: () => createApiClient({ data: { name } }),
    onSuccess: async (res) => {
      setIssued(res.token);
      setName(null);
      await qc.invalidateQueries({ queryKey: ["api-clients"] });
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => revokeApiClient({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-clients"] }),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const example = `curl -X POST ${origin}/api/v1/check \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Essay 1","author":"Student name","text":"..."}'`;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">API</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Connect your LMS or other systems. Send work in and get scores back.
        </p>
      </header>

      {!staff ? (
        <p className="text-sm text-muted">Staff only.</p>
      ) : (
        <>
          <section className="rounded-[22px] border border-line bg-surface p-5">
            <h2 className="font-semibold">API keys</h2>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                issue.mutate();
              }}
            >
              <div className="flex-1">
                <Label htmlFor="n">Name</Label>
                <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button type="submit" disabled={issue.isPending}>
                Create key
              </Button>
            </form>
            {issue.error && <p className="mt-2 text-sm text-risk">{issue.error.message}</p>}
            {issued && (
              <div className="mt-3 rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">
                <p className="font-medium">Copy this key now. It will not be shown again.</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="break-all font-mono text-xs">{issued}</code>
                  <button
                    type="button"
                    className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-ok/10"
                    aria-label="Copy key"
                    onClick={async () => {
                      await navigator.clipboard.writeText(issued);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    <Copy className="size-4" />
                  </button>
                  {copied && <span className="text-xs">Copied</span>}
                </div>
              </div>
            )}
            <ul className="mt-4 divide-y divide-line">
              {(clients.data ?? []).length === 0 && (
                <li className="py-2 text-sm text-muted">No keys yet.</li>
              )}
              {(clients.data ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{c.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{c.key_prefix}…</span>
                    <span className="ml-2 text-xs text-muted">{formatDate(c.created_at)}</span>
                  </span>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-risk"
                    aria-label={`Revoke ${c.name}`}
                    onClick={() => {
                      if (window.confirm(`Revoke ${c.name}? It stops working immediately.`))
                        revoke.mutate(c.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[22px] border border-line bg-surface p-5">
            <h2 className="font-semibold">Endpoints</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-mono text-xs text-lime-ink">POST /api/v1/check</dt>
                <dd className="text-ink-soft">
                  Body: text (required), title, author, filename, assignmentId. Returns scores and
                  reportId.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-lime-ink">GET /api/v1/reports/:reportId</dt>
                <dd className="text-ink-soft">Returns scores and matched sources.</dd>
              </div>
            </dl>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 font-mono text-xs leading-relaxed text-paper">
              {example}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}

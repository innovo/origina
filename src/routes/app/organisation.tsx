import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  addCampus,
  getMyOrganization,
  regenerateJoinCode,
  removeCampus,
  updateMyOrganization,
} from "@/lib/origina/actions";

export const Route = createFileRoute("/app/organisation")({ component: Organisation });

function Organisation() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-organization"], queryFn: () => getMyOrganization() });
  const org = q.data;

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [domains, setDomains] = useState("");
  const [admins, setAdmins] = useState("");
  const [campusName, setCampusName] = useState("");
  const [campusDetail, setCampusDetail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setShortName(org.shortName);
    setDomains(org.emailDomains ?? "");
    setAdmins(org.adminEmails ?? "");
  }, [org]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["my-organization"] });
    await qc.invalidateQueries({ queryKey: ["campuses"] });
    await qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const save = useMutation({
    mutationFn: () =>
      updateMyOrganization({
        data: { name, shortName, emailDomains: domains, adminEmails: admins, campuses: [] },
      }),
    onSuccess: refresh,
  });
  const regen = useMutation({ mutationFn: () => regenerateJoinCode(), onSuccess: refresh });
  const add = useMutation({
    mutationFn: () => addCampus({ data: { name: campusName, detail: campusDetail } }),
    onSuccess: async () => {
      setCampusName("");
      setCampusDetail("");
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeCampus({ data: { id } }),
    onSuccess: refresh,
  });

  if (q.isPending) return <p className="text-sm text-muted">Loading organisation…</p>;
  if (q.error || !org) {
    return (
      <p className="text-sm text-risk">
        {q.error instanceof Error ? q.error.message : "Could not load the organisation."}
      </p>
    );
  }

  const invite =
    typeof window !== "undefined" && org.joinCode
      ? `Sign up for Origina at ${window.location.origin}/login and enter join code ${org.joinCode} to join ${org.name}.`
      : "";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">{org.name}</h1>
      </header>

      {org.joinCode && (
        <section className="rounded-[22px] border border-line bg-surface p-5">
          <h2 className="font-semibold">Join code</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-navy px-4 py-2 font-mono text-xl tracking-[0.3em] text-lime">
              {org.joinCode}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(invite);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Copy className="size-4" /> {copied ? "Copied" : "Copy invite"}
            </Button>
            {org.canEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => regen.mutate()}
                disabled={regen.isPending}
              >
                <RefreshCw className="size-4" /> New code
              </Button>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="rounded-[22px] border border-line bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <h2 className="font-semibold">Details</h2>
          <fieldset disabled={!org.canEdit} className="mt-3 space-y-3">
            <div>
              <Label htmlFor="oname">Full name</Label>
              <Input id="oname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="oshort">Short name</Label>
              <Input id="oshort" value={shortName} onChange={(e) => setShortName(e.target.value)} />
            </div>
            {org.canEdit && (
              <>
                <div>
                  <Label htmlFor="odomains">Email domains (join automatically)</Label>
                  <Input
                    id="odomains"
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                    placeholder="college.ac.za, students.college.ac.za"
                  />
                </div>
                <div>
                  <Label htmlFor="oadmins">Admin emails (become admins on joining)</Label>
                  <Input
                    id="oadmins"
                    value={admins}
                    onChange={(e) => setAdmins(e.target.value)}
                    placeholder="it@college.ac.za"
                  />
                </div>
                {save.error && <p className="text-sm text-risk">{save.error.message}</p>}
                <Button type="submit" disabled={save.isPending}>
                  {save.isSuccess && !save.isPending ? "Saved" : "Save details"}
                </Button>
              </>
            )}
          </fieldset>
        </form>

        <section className="rounded-[22px] border border-line bg-surface p-5">
          <h2 className="font-semibold">Campuses (optional)</h2>
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {org.campuses.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted">No campuses yet.</li>
            )}
            {org.campuses.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">{c.name}</span>
                  {c.detail && <span className="text-xs text-muted">{c.detail}</span>}
                </span>
                {org.canEdit && (
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-risk"
                    aria-label={`Remove ${c.name}`}
                    onClick={() => {
                      if (window.confirm(`Remove ${c.name}? People and courses keep their data.`))
                        remove.mutate(c.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {org.canEdit && (
            <form
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                add.mutate();
              }}
            >
              <div>
                <Label htmlFor="cname">Campus</Label>
                <Input
                  id="cname"
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cdetail">Detail (optional)</Label>
                <Input
                  id="cdetail"
                  value={campusDetail}
                  onChange={(e) => setCampusDetail(e.target.value)}
                  placeholder="Region or faculty"
                />
              </div>
              <Button type="submit" disabled={add.isPending}>
                Add
              </Button>
              {add.error && <p className="text-sm text-risk sm:col-span-3">{add.error.message}</p>}
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

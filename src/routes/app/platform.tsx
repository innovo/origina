import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  createOrganization,
  getProfile,
  listOrganizations,
  switchOrganization,
} from "@/lib/origina/actions";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/platform")({ component: Platform });

function Platform() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const orgs = useQuery({ queryKey: ["organizations"], queryFn: () => listOrganizations() });

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [domains, setDomains] = useState("");
  const [admins, setAdmins] = useState("");
  const [campuses, setCampuses] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createOrganization({
        data: {
          name,
          shortName,
          emailDomains: domains,
          adminEmails: admins,
          campuses: campuses.split("\n"),
        },
      }),
    onSuccess: async () => {
      setName("");
      setShortName("");
      setDomains("");
      setAdmins("");
      setCampuses("");
      await qc.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const open = useMutation({
    mutationFn: (orgId: string) => switchOrganization({ data: { orgId } }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      await nav({ to: "/app" });
    },
  });

  if (profile.data && !profile.data.isPlatformAdmin) {
    return <p className="text-sm text-risk">Platform administrators only.</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Platform</h1>
      </header>

      {create.data && (
        <aside className="rounded-[22px] border border-lime-deep bg-lime-soft p-5 text-sm">
          <p className="font-semibold">{create.data.name} is registered.</p>
          <p className="mt-1 text-ink-soft">
            Join code:{" "}
            <span className="font-mono font-semibold tracking-widest text-ink">
              {create.data.joinCode}
            </span>
          </p>
        </aside>
      )}

      <section className="overflow-x-auto rounded-[22px] border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Join code</th>
              <th className="px-4 py-3 font-medium">People</th>
              <th className="px-4 py-3 font-medium">Submissions</th>
              <th className="px-4 py-3 font-medium">Campuses</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs.data?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-muted">
                  No clients yet. Register the first one below.
                </td>
              </tr>
            )}
            {(orgs.data ?? []).map((o) => {
              const current = profile.data?.orgId === o.id;
              return (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <span className="block font-medium">{o.name}</span>
                    {o.emailDomains && (
                      <span className="text-xs text-muted">{o.emailDomains}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono tracking-widest">{o.joinCode}</td>
                  <td className="px-4 py-3 tabular-nums">{o.people}</td>
                  <td className="px-4 py-3 tabular-nums">{o.submissions}</td>
                  <td className="px-4 py-3 tabular-nums">{o.campuses}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {current ? (
                      <span className="text-xs font-semibold uppercase tracking-wider text-lime-ink">
                        Current
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={open.isPending}
                        onClick={() => open.mutate(o.id)}
                      >
                        Open <ArrowRight className="size-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {open.error && <p className="text-sm text-risk">{open.error.message}</p>}

      <form
        className="max-w-2xl rounded-[22px] border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <h2 className="flex items-center gap-2 font-semibold">
          <Building2 className="size-4 text-lime-ink" /> Register a client
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pname">Institution name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="pshort">Short name</Label>
            <Input
              id="pshort"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="Shown in the app header"
            />
          </div>
          <div>
            <Label htmlFor="pdomains">Email domains (optional)</Label>
            <Input
              id="pdomains"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="college.ac.za"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="padmins">Administrator emails</Label>
            <Input
              id="padmins"
              value={admins}
              onChange={(e) => setAdmins(e.target.value)}
              placeholder="it@college.ac.za, registrar@college.ac.za"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pcampuses">Campuses (optional, one per line)</Label>
            <Textarea
              id="pcampuses"
              className="min-h-24"
              value={campuses}
              onChange={(e) => setCampuses(e.target.value)}
            />
          </div>
        </div>
        {create.error && <p className="mt-3 text-sm text-risk">{create.error.message}</p>}
        <Button type="submit" className="mt-4" disabled={create.isPending}>
          {create.isPending ? "Registering…" : "Register client"}
        </Button>
      </form>
    </div>
  );
}

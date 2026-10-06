import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  addLibraryDocument,
  getProfile,
  listCorpus,
  removeLibraryDocument,
} from "@/lib/origina/actions";
import { extractTextFromFile } from "@/lib/origina/extract";

export const Route = createFileRoute("/app/corpus")({ component: CorpusPage });

function CorpusPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["corpus"], queryFn: () => listCorpus() });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const staff = profile.data?.role === "teacher" || profile.data?.role === "admin";
  const [title, setTitle] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: () => addLibraryDocument({ data: { title, text, sourceRef } }),
    onSuccess: async () => {
      setTitle("");
      setSourceRef("");
      setText("");
      await qc.invalidateQueries({ queryKey: ["corpus"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeLibraryDocument({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["corpus"] }),
  });

  const own = (q.data ?? []).filter((c) => c.org_id);
  const shared = (q.data ?? []).filter((c) => !c.org_id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Source library</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Every check is compared against these sources and earlier work from your institution.
        </p>
      </header>

      <section>
        <h2 className="font-display text-xl font-medium">Your institution</h2>
        <ul className="mt-3 divide-y divide-line rounded-[22px] border border-line bg-surface">
          {own.length === 0 && <li className="px-4 py-3 text-sm text-muted">No sources yet.</li>}
          {own.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block text-sm font-medium">{c.title}</span>
                {c.source_ref && <span className="text-xs text-muted">{c.source_ref}</span>}
              </span>
              {staff && (
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-lg text-muted hover:bg-paper-2 hover:text-risk"
                  aria-label={`Remove ${c.title}`}
                  onClick={() => {
                    if (window.confirm(`Remove ${c.title}?`)) remove.mutate(c.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {staff && (
        <form
          className="rounded-[22px] border border-line bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <h2 className="font-semibold">Add a source</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="lt">Title</Label>
              <Input id="lt" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="lr">Reference (optional)</Label>
              <Input
                id="lr"
                value={sourceRef}
                onChange={(e) => setSourceRef(e.target.value)}
                placeholder="e.g. Module guide 2026"
              />
            </div>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-lime-ink">
            <FileUp className="size-4" /> Upload .docx, .pdf, .pptx, .html or .txt
            <input
              type="file"
              className="sr-only"
              accept=".txt,.md,.html,.htm,.docx,.pdf,.pptx"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileError(null);
                try {
                  setText(await extractTextFromFile(file));
                  if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
                } catch (err) {
                  setFileError(err instanceof Error ? err.message : "Could not read that file.");
                }
              }}
            />
          </label>
          <div className="mt-3">
            <Label htmlFor="ltext">Text</Label>
            <Textarea
              id="ltext"
              className="min-h-40"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
          {(fileError || add.error) && (
            <p className="mt-2 text-sm text-risk">{fileError ?? add.error?.message}</p>
          )}
          <Button type="submit" className="mt-3" disabled={add.isPending}>
            {add.isPending ? "Adding…" : "Add source"}
          </Button>
        </form>
      )}

      <section>
        <h2 className="font-display text-xl font-medium">Shared sample library</h2>
        <ul className="mt-3 divide-y divide-line rounded-[22px] border border-line bg-surface">
          {shared.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <p className="text-sm font-medium">{c.title}</p>
              {c.source_ref && <p className="text-xs text-muted">{c.source_ref}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

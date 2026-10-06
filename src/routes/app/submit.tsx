import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileUp, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SAMPLE_TEXTS } from "@/lib/origina/corpus";
import { analyseSubmission, listAssignments } from "@/lib/origina/actions";
import { extractTextFromFile } from "@/lib/origina/extract";

export const Route = createFileRoute("/app/submit")({ component: Submit });

const STAGES = [
  "Extracting text",
  "Obfuscation agent",
  "Similarity agent",
  "Authorship agent",
  "Citation agent",
  "Writing the report",
];

function Submit() {
  const nav = useNavigate();
  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: () => listAssignments(),
  });
  const [title, setTitle] = useState("");
  const [filename, setFilename] = useState("pasted.txt");
  const [text, setText] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<number | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const chunks: string[] = [];
    const names: string[] = [];
    for (const file of Array.from(files)) {
      names.push(file.name);
      try {
        chunks.push(await extractTextFromFile(file));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read that file.");
        return;
      }
    }
    setFilename(names.join(", "));
    setText(chunks.join("\n\n"));
    if (!title) setTitle(names[0].replace(/\.[^.]+$/, ""));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStage(0);
    const timer = window.setInterval(() => {
      setStage((s) => (s == null ? 0 : Math.min(STAGES.length - 1, s + 1)));
    }, 700);
    try {
      const result = await analyseSubmission({
        data: {
          title,
          filename,
          text,
          assignmentId: assignmentId || null,
        },
      });
      window.clearInterval(timer);
      await nav({ to: "/app/reports/$reportId", params: { reportId: result.reportId } });
    } catch (err) {
      window.clearInterval(timer);
      setStage(null);
      setError(err instanceof Error ? err.message : "Analysis failed.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Submit writing</h1>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="assignment">Assignment (optional)</Label>
          <select
            id="assignment"
            className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm"
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
          >
            <option value="">Independent check</option>
            {(assignments.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.courseCode} · {a.title}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-line-strong bg-surface px-4 py-10 text-center">
          <FileUp className="size-6 text-lime-ink" />
          <span className="mt-2 text-sm font-medium">Drop files or browse</span>
          <span className="mt-1 text-xs text-muted">
            .docx .pdf .pptx .html .txt
          </span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept=".txt,.md,.html,.htm,.docx,.pdf,.pptx"
            onChange={(e) => void onFiles(e.target.files)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TEXTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="h-9 rounded-full border border-line bg-surface px-3 text-xs"
              onClick={() => {
                setText(s.text);
                setTitle(s.title);
                setFilename(`${s.id}.txt`);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div>
          <Label htmlFor="body">Extracted text</Label>
          <Textarea
            id="body"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-56"
            required
          />
        </div>
        {error && <p className="text-sm text-risk">{error}</p>}
        {stage != null ? (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
            <Loader2 className="size-4 animate-spin text-lime-ink" />
            {STAGES[stage]}
          </div>
        ) : (
          <Button type="submit" className="w-full sm:w-auto">
            Run detection agents
          </Button>
        )}
      </form>
    </div>
  );
}

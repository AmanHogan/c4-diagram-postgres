"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Check, Download, X, Code, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiagramDocument } from "@/lib/diagram-types";
import { diagramToMermaid } from "@/lib/mermaid-export";

interface MermaidPanelProps {
  getDiagram: () => DiagramDocument;
  diagramName: string;
  onClose: () => void;
}

export function MermaidPanel({ getDiagram, diagramName, onClose }: MermaidPanelProps): React.JSX.Element {
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);
  const [mermaidCode, setMermaidCode] = useState(() => diagramToMermaid(getDiagram()));
  const previewRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    setMermaidCode(diagramToMermaid(getDiagram()));
  }, [getDiagram]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [mermaidCode]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([mermaidCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${diagramName}.mmd`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [mermaidCode, diagramName]);

  useEffect(() => {
    if (tab !== "preview" || !previewRef.current) return;
    let cancelled = false;

    async function render(): Promise<void> {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
      });

      if (cancelled || !previewRef.current) return;
      previewRef.current.innerHTML = "";

      const id = `mermaid-preview-${Date.now()}`;
      try {
        const { svg } = await mermaid.render(id, mermaidCode);
        if (!cancelled && previewRef.current) {
          previewRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled && previewRef.current) {
          previewRef.current.innerHTML =
            '<p class="text-sm text-destructive p-4">Failed to render Mermaid diagram. The diagram may be empty or have unsupported syntax.</p>';
        }
      }
    }

    void render();
    return (): void => { cancelled = true; };
  }, [tab, mermaidCode]);

  return (
    <div className="flex h-full w-96 shrink-0 flex-col border-l bg-sidebar">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Mermaid Export
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b">
        <button
          type="button"
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium ${
            tab === "code"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("code")}
        >
          <Code className="h-3.5 w-3.5" /> Code
        </button>
        <button
          type="button"
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium ${
            tab === "preview"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("preview")}
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
      </div>

      <div className="flex gap-1.5 border-b px-3 py-2">
        <Button size="sm" variant="outline" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
        <Button size="sm" variant="outline" onClick={() => void handleCopy()}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" /> .mmd
        </Button>
      </div>

      {tab === "code" ? (
        <div className="flex-1 overflow-auto p-3">
          <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-foreground">
            {mermaidCode}
          </pre>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3">
          <div
            ref={previewRef}
            className="flex items-start justify-center rounded-lg bg-muted/50 p-4 [&_svg]:max-w-full"
          >
            <p className="text-xs text-muted-foreground">Rendering...</p>
          </div>
        </div>
      )}
    </div>
  );
}

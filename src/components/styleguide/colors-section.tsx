import { Section } from "./item";

type Tok = { id: number; name: string; hex: string; cls: string; ring?: boolean };

const TOKENS: Tok[] = [
  { id: 1, name: "background", hex: "#0f172a", cls: "bg-background", ring: true },
  { id: 2, name: "foreground", hex: "#ffffff", cls: "bg-foreground" },
  { id: 3, name: "card", hex: "#1e293b", cls: "bg-card" },
  { id: 4, name: "card-foreground", hex: "#ffffff", cls: "bg-card-foreground" },
  { id: 5, name: "popover", hex: "#1e293b", cls: "bg-popover" },
  { id: 6, name: "primary", hex: "#10b981", cls: "bg-primary" },
  { id: 7, name: "primary-fg", hex: "#022c22", cls: "bg-primary-foreground" },
  { id: 8, name: "secondary", hex: "#1e293b", cls: "bg-secondary" },
  { id: 9, name: "secondary-fg", hex: "#e2e8f0", cls: "bg-secondary-foreground" },
  { id: 10, name: "muted", hex: "#334155", cls: "bg-muted" },
  { id: 11, name: "muted-fg", hex: "#cbd5e1", cls: "bg-muted-foreground" },
  { id: 12, name: "accent", hex: "#1e293b", cls: "bg-accent" },
  { id: 13, name: "accent-fg", hex: "#ffffff", cls: "bg-accent-foreground" },
  { id: 14, name: "destructive", hex: "#ef4444", cls: "bg-destructive" },
  { id: 15, name: "destructive-fg", hex: "#ffffff", cls: "bg-destructive-foreground" },
  { id: 16, name: "border", hex: "#475569", cls: "bg-border" },
  { id: 17, name: "input", hex: "#475569", cls: "bg-input" },
  { id: 18, name: "ring", hex: "#10b981", cls: "bg-ring" },
  { id: 19, name: "chart-1", hex: "#10b981", cls: "bg-chart-1" },
  { id: 20, name: "chart-2", hex: "#3b82f6", cls: "bg-chart-2" },
  { id: 21, name: "chart-3", hex: "#f59e0b", cls: "bg-chart-3" },
  { id: 22, name: "chart-4", hex: "#ef4444", cls: "bg-chart-4" },
  { id: 23, name: "chart-5", hex: "#8b5cf6", cls: "bg-chart-5" },
];

function Swatch({ tok }: { tok: Tok }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-2">
      <div
        className={`mb-2 h-12 w-full rounded-md ${tok.cls} ${
          tok.ring ? "ring-1 ring-inset ring-border" : ""
        }`}
      />
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded bg-primary/15 px-1 font-mono text-[10px] font-bold text-primary">
          {tok.id}
        </span>
        <span className="truncate text-xs font-medium text-secondary-foreground">
          {tok.name}
        </span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">{tok.hex}</span>
    </div>
  );
}

export function ColorsSection() {
  return (
    <Section
      anchor="colors"
      n={1}
      title="Couleurs & tokens"
      description="Palette du thème (globals.css). Dark slate + accent emerald."
    >
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {TOKENS.map((t) => (
          <Swatch key={t.id} tok={t} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded bg-primary/15 px-1 font-mono text-[10px] font-bold text-primary">
              24
            </span>
            <span className="text-xs font-medium text-secondary-foreground">radius</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="h-10 w-10 rounded-sm bg-muted" title="sm" />
            <div className="h-10 w-10 rounded-md bg-muted" title="md" />
            <div className="h-10 w-10 rounded-lg bg-muted" title="lg 0.75rem" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">sm · md · lg</span>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded bg-primary/15 px-1 font-mono text-[10px] font-bold text-primary">
              25
            </span>
            <span className="text-xs font-medium text-secondary-foreground">shadow-hard</span>
          </div>
          <div className="px-1 py-2">
            <div className="h-10 w-16 rounded-md bg-muted shadow-[var(--shadow-hard)]" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            4px 4px emerald/22
          </span>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded bg-primary/15 px-1 font-mono text-[10px] font-bold text-primary">
              26
            </span>
            <span className="text-xs font-medium text-secondary-foreground">
              shadow-hard-sm
            </span>
          </div>
          <div className="px-1 py-2">
            <div className="h-10 w-16 rounded-md bg-muted shadow-[var(--shadow-hard-sm)]" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            3px 3px emerald/18
          </span>
        </div>
      </div>
    </Section>
  );
}

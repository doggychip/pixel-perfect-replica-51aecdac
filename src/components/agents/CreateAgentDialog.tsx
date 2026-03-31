import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { agentTypeLabel } from "@/lib/format";

const ROLES = ["scanner", "trader", "researcher", "sentinel"] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { name: string; role: string; instruments: string; domains: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; role: string; instruments: string; domains: string }>>;
  onSubmit: () => void;
  isPending: boolean;
  error: string;
}

export default function CreateAgentDialog({ open, onOpenChange, form, setForm, onSubmit, isPending, error }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-card-border max-w-md">
        <DialogHeader>
          <DialogTitle>Create Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {error && (
            <div className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Alpha Scanner"
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role *</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{agentTypeLabel(r)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Instruments</label>
            <input
              type="text"
              value={form.instruments}
              onChange={e => setForm(f => ({ ...f, instruments: e.target.value }))}
              placeholder="BTC, ETH, SOL"
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-[10px] text-muted-foreground">Comma-separated list of instruments</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Domains</label>
            <input
              type="text"
              value={form.domains}
              onChange={e => setForm(f => ({ ...f, domains: e.target.value }))}
              placeholder="defi, nft, macro"
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-[10px] text-muted-foreground">Comma-separated list of domains</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
              onClick={onSubmit}
              disabled={!form.name || isPending}
            >
              {isPending ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

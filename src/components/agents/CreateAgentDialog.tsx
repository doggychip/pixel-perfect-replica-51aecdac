import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { agentTypeLabel } from "@/lib/format";
import { roleIcons } from "./AgentCard";
import { useState } from "react";

const AGENT_ROLES = ["scanner", "trader", "researcher", "sentinel"] as const;

interface CreateAgentForm {
  name: string;
  role: string;
  instruments: string;
  domains: string;
}

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; role: string; instruments: string[]; domains: string[] }) => void;
  isPending: boolean;
  error: string;
}

export function CreateAgentDialog({ open, onOpenChange, onSubmit, isPending, error }: CreateAgentDialogProps) {
  const [form, setForm] = useState<CreateAgentForm>({ name: "", role: "scanner", instruments: "", domains: "" });

  const handleSubmit = () => {
    const instruments = form.instruments.split(",").map(s => s.trim()).filter(Boolean);
    const domains = form.domains.split(",").map(s => s.trim()).filter(Boolean);
    onSubmit({ name: form.name, role: form.role, instruments, domains });
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm({ name: "", role: "scanner", instruments: "", domains: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
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
              placeholder="My Agent"
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {AGENT_ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm transition-colors ${
                    form.role === role
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {roleIcons[role]}
                  <span className="font-medium">{agentTypeLabel(role)}</span>
                </button>
              ))}
            </div>
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
            <p className="text-[10px] text-muted-foreground">Comma-separated list of instruments to track</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Domains</label>
            <input
              type="text"
              value={form.domains}
              onChange={e => setForm(f => ({ ...f, domains: e.target.value }))}
              placeholder="crypto, equities, macro"
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-[10px] text-muted-foreground">Comma-separated list of analysis domains</p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={handleSubmit}
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

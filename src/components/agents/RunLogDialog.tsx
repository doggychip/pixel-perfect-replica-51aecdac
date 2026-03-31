import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Activity } from "lucide-react";

interface RunLogEntry {
  action?: string;
  type?: string;
  message?: string;
  result?: string;
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface RunLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  log: RunLogEntry[] | Record<string, unknown> | null;
  isLoading: boolean;
}

function statusIcon(status?: string) {
  switch (status) {
    case "success": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    case "error":
    case "failed": return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    case "pending": return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
    default: return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

export function RunLogDialog({ open, onOpenChange, agentName, log, isLoading }: RunLogDialogProps) {
  const entries: RunLogEntry[] = Array.isArray(log) ? log : [];
  const rawResult = !Array.isArray(log) && log ? log : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Run Log — {agentName}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Running agent…
          </div>
        )}

        {!isLoading && entries.length > 0 && (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 pr-3">
              {entries.map((entry, i) => (
                <div key={i} className="flex gap-2.5 p-2.5 rounded-md bg-muted/30 border border-border text-sm">
                  <div className="mt-0.5">{statusIcon(entry.status)}</div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {entry.action || entry.type || `Step ${i + 1}`}
                      </span>
                      {entry.status && (
                        <Badge variant="outline" className="text-[10px]">{entry.status}</Badge>
                      )}
                    </div>
                    {(entry.message || entry.result) && (
                      <p className="text-xs text-muted-foreground break-words">
                        {entry.message || String(entry.result)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {!isLoading && entries.length === 0 && rawResult && (
          <ScrollArea className="max-h-[400px]">
            <pre className="text-xs font-mono bg-muted/30 border border-border rounded-md p-3 whitespace-pre-wrap break-words text-foreground">
              {JSON.stringify(rawResult, null, 2)}
            </pre>
          </ScrollArea>
        )}

        {!isLoading && !log && (
          <p className="text-sm text-muted-foreground text-center py-6">No log data returned.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

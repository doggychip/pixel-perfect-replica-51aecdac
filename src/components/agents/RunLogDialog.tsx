import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  log: any;
  isPending: boolean;
}

export default function RunLogDialog({ open, onOpenChange, agentName, log, isPending }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-card-border max-w-lg">
        <DialogHeader>
          <DialogTitle>Run Log — {agentName}</DialogTitle>
        </DialogHeader>
        {isPending ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Running agent…
          </div>
        ) : log ? (
          <ScrollArea className="max-h-80">
            <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap p-3 bg-background rounded-md border border-input">
              {typeof log === "string" ? log : JSON.stringify(log, null, 2)}
            </pre>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No log data.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

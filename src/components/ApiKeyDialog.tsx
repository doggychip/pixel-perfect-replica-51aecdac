import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/claudeApi";
import { Key, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: Props) {
  const existing = getApiKey();
  const [key, setKey] = useState("");

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      setKey("");
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setKey("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-primary neon-text flex items-center gap-2">
            <Key className="w-5 h-5" /> API Key
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your Anthropic API key. It's stored in localStorage only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder={existing ? "••••••••••••" : "sk-ant-..."}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="bg-secondary border-border font-mono text-sm"
          />
          {existing && (
            <p className="text-xs text-muted-foreground">
              ✓ Key configured. Enter a new key to replace or clear it.
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          {existing && (
            <Button variant="destructive" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4" /> Clear
            </Button>
          )}
          <Button onClick={handleSave} disabled={!key.trim()} className="font-display">
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

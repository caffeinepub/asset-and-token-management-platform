import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetStripeConfiguration } from "@/hooks/useQueries";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface StripeSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StripeSetup({ open, onOpenChange }: StripeSetupProps) {
  const [secretKey, setSecretKey] = useState("");
  const [countries, setCountries] = useState("US,CA,GB");
  const setConfig = useSetStripeConfiguration();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!secretKey.trim()) return;

    const allowedCountries = countries
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      await setConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries,
      });
      onOpenChange(false);
      setSecretKey("");
    } catch {
      // error handled by mutation onError
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Configure Stripe</DialogTitle>
          <DialogDescription>
            Enter your Stripe secret key to enable payment processing for
            subscription upgrades.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="stripe-secret-key">Secret Key</Label>
            <Input
              id="stripe-secret-key"
              type="password"
              placeholder="sk_live_... or sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Found in your Stripe Dashboard under API keys.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-countries">Allowed Countries</Label>
            <Input
              id="stripe-countries"
              type="text"
              placeholder="US,CA,GB"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated ISO country codes (e.g. US,CA,GB).
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={setConfig.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={setConfig.isPending || !secretKey.trim()}
            >
              {setConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

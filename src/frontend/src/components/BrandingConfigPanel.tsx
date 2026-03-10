import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCallerRole,
  usePlatformConfig,
  useSetPlatformConfig,
} from "@/hooks/useQueries";
import { ChevronDown, Loader2, Palette } from "lucide-react";
import { useEffect, useState } from "react";

export default function BrandingConfigPanel() {
  const { data: callerRole } = useCallerRole();
  const { platformName, tagline, accentColor } = usePlatformConfig();
  const setConfig = useSetPlatformConfig();

  const [name, setName] = useState(platformName);
  const [tag, setTag] = useState(tagline);
  const [color, setColor] = useState(accentColor);
  const [showSuccess, setShowSuccess] = useState(false);

  // Seed form from fetched config when it loads
  useEffect(() => {
    setName(platformName);
    setTag(tagline);
    setColor(accentColor);
  }, [platformName, tagline, accentColor]);

  if (callerRole !== "admin") return null;

  async function handleSave() {
    setShowSuccess(false);
    try {
      await setConfig.mutateAsync({
        platformName: name,
        tagline: tag,
        accentColor: color,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // error handled by mutation onError
    }
  }

  return (
    <Collapsible defaultOpen={false} data-ocid="branding.panel">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-medium hover:bg-accent/50 transition-colors group">
        <span className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          Platform Branding
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3 space-y-4">
        {/* Platform Name */}
        <div className="space-y-1.5">
          <Label htmlFor="branding-name" className="text-xs font-medium">
            Platform Name
          </Label>
          <Input
            id="branding-name"
            data-ocid="branding.name.input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Platform"
            className="h-8 text-sm"
          />
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <Label htmlFor="branding-tagline" className="text-xs font-medium">
            Tagline
          </Label>
          <Input
            id="branding-tagline"
            data-ocid="branding.tagline.input"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Your platform tagline"
            className="h-8 text-sm"
          />
        </div>

        {/* Accent Color */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Accent Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
              aria-label="Color picker"
            />
            <Input
              data-ocid="branding.accent.input"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#6366f1"
              className="h-8 text-sm font-mono flex-1"
            />
          </div>
        </div>

        {/* Live Preview */}
        <div
          data-ocid="branding.preview.section"
          className="rounded-md border border-border bg-muted/20 p-3 space-y-1"
        >
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
            Preview
          </p>
          <p
            className="font-semibold text-base leading-tight"
            style={{ color: color || "#6366f1" }}
          >
            {name || "Platform"}
          </p>
          {tag && <p className="text-sm text-muted-foreground">{tag}</p>}
        </div>

        {/* States */}
        {setConfig.isPending && (
          <div
            data-ocid="branding.loading_state"
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving branding...
          </div>
        )}

        {showSuccess && !setConfig.isPending && (
          <div
            data-ocid="branding.success_state"
            className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-700 dark:text-green-400 font-medium"
          >
            Branding saved successfully.
          </div>
        )}

        {setConfig.isError && !setConfig.isPending && (
          <div
            data-ocid="branding.error_state"
            className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive font-medium"
          >
            {setConfig.error instanceof Error
              ? setConfig.error.message
              : "Failed to save branding."}
          </div>
        )}

        {/* Save */}
        <Button
          data-ocid="branding.save.button"
          size="sm"
          className="w-full"
          onClick={handleSave}
          disabled={setConfig.isPending}
        >
          {setConfig.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Branding"
          )}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}

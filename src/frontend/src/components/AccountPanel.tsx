import { SubscriptionTier } from "@/backend";
import { UserRole } from "@/backend";
import BrandingConfigPanel from "@/components/BrandingConfigPanel";
import StripeSetup from "@/components/StripeSetup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useCreateCheckoutSession,
  useIsStripeConfigured,
  useMyRole,
  useMySubscription,
  useProjectCountForCaller,
} from "@/hooks/useQueries";
import { AlertCircle, CreditCard, Settings, User, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Tier limits
const TIER_LIMITS: Record<SubscriptionTier, number | null> = {
  [SubscriptionTier.free]: 3,
  [SubscriptionTier.starter]: 20,
  [SubscriptionTier.pro]: null, // unlimited
};

const TIER_LABELS: Record<SubscriptionTier, string> = {
  [SubscriptionTier.free]: "Free",
  [SubscriptionTier.starter]: "Starter",
  [SubscriptionTier.pro]: "Pro",
};

const UPGRADE_TARGETS: Partial<Record<SubscriptionTier, SubscriptionTier>> = {
  [SubscriptionTier.free]: SubscriptionTier.starter,
  [SubscriptionTier.starter]: SubscriptionTier.pro,
};

const UPGRADE_PRICES: Record<string, string> = {
  [SubscriptionTier.starter]: "$9.99/mo",
  [SubscriptionTier.pro]: "$29.99/mo",
};

const SHOPPING_ITEMS: Record<
  string,
  {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
  }
> = {
  [SubscriptionTier.starter]: {
    productName: "Starter Plan",
    currency: "usd",
    quantity: 1n,
    priceInCents: 999n,
    productDescription: "20 projects, advanced features",
  },
  [SubscriptionTier.pro]: {
    productName: "Pro Plan",
    currency: "usd",
    quantity: 1n,
    priceInCents: 2999n,
    productDescription: "Unlimited projects, all features",
  },
};

interface AccountPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountPanel({
  open,
  onOpenChange,
}: AccountPanelProps) {
  const { identity } = useInternetIdentity();
  const {
    data: subscription,
    isLoading: subLoading,
    isError: subError,
  } = useMySubscription();
  const {
    data: projectCountRaw,
    isLoading: countLoading,
    isError: countError,
  } = useProjectCountForCaller();
  const { data: myRole } = useMyRole();
  const { data: stripeConfigured } = useIsStripeConfigured();
  const createCheckout = useCreateCheckoutSession();

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [stripeSetupOpen, setStripeSetupOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const isLoading = subLoading || countLoading;
  const isError = subError || countError;
  const isAdmin = myRole === UserRole.admin;

  const tier = subscription?.tier ?? SubscriptionTier.free;
  const projectCount = Number(projectCountRaw ?? 0n);
  const tierLimit = TIER_LIMITS[tier];
  const upgradeTarget = UPGRADE_TARGETS[tier];

  const progressValue =
    tierLimit !== null ? Math.min(100, (projectCount / tierLimit) * 100) : 0;

  const principal = identity?.getPrincipal().toString() ?? "";
  const principalShort = principal
    ? `${principal.slice(0, 12)}...${principal.slice(-6)}`
    : "";

  async function handleUpgradeConfirm() {
    if (!upgradeTarget) return;

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const successUrl = `${baseUrl}/payment-success?tier=${upgradeTarget}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment-failure`;

    setCheckingOut(true);
    try {
      const session = await createCheckout.mutateAsync({
        items: [SHOPPING_ITEMS[upgradeTarget]],
        successUrl,
        cancelUrl,
      });
      window.location.href = session.url;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to start checkout";
      toast.error(msg);
      setCheckingOut(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[380px] sm:w-[420px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account
            </SheetTitle>
            <SheetDescription>
              Manage your subscription and account settings.
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="space-y-4" data-ocid="account.loading_state">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : isError ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3"
              data-ocid="account.error_state"
            >
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Failed to load account
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unable to fetch subscription details. Please try again.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6" data-ocid="account.panel">
              {/* Principal */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">
                  Principal
                </p>
                <p className="font-mono text-xs text-foreground break-all leading-relaxed">
                  {principalShort || "Not authenticated"}
                </p>
              </div>

              {/* Tier badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Current Plan
                </span>
                <Badge
                  data-ocid="account.tier.badge"
                  className={
                    tier === SubscriptionTier.pro
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-400/40 hover:bg-amber-500/30"
                      : tier === SubscriptionTier.starter
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-400/40 hover:bg-blue-500/30"
                        : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                  }
                  variant="outline"
                >
                  {tier === SubscriptionTier.pro && (
                    <Zap className="h-3 w-3 mr-1" />
                  )}
                  {TIER_LABELS[tier]}
                </Badge>
              </div>

              {/* Usage section */}
              <div className="space-y-3" data-ocid="account.usage.section">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Projects Used</span>
                  {tierLimit !== null ? (
                    <span className="text-muted-foreground">
                      <span
                        className={
                          projectCount >= tierLimit
                            ? "text-destructive font-semibold"
                            : "text-foreground font-semibold"
                        }
                      >
                        {projectCount}
                      </span>{" "}
                      of <span>{tierLimit}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-semibold">
                        {projectCount}
                      </span>{" "}
                      of{" "}
                      <span className="text-primary font-semibold">
                        Unlimited
                      </span>
                    </span>
                  )}
                </div>

                {tierLimit !== null ? (
                  <div className="space-y-1.5">
                    <Progress
                      value={progressValue}
                      className={`h-2 ${progressValue >= 90 ? "[&>div]:bg-destructive" : progressValue >= 70 ? "[&>div]:bg-amber-500" : ""}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {tierLimit - projectCount > 0
                        ? `${tierLimit - projectCount} project${
                            tierLimit - projectCount === 1 ? "" : "s"
                          } remaining`
                        : "Limit reached — upgrade to create more projects"}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                    <Zap className="h-3 w-3" />
                    Unlimited projects available
                  </p>
                )}
              </div>

              {/* Upgrade CTA */}
              {upgradeTarget && (
                <div className="space-y-3">
                  <div className="border-t pt-4">
                    <Button
                      data-ocid="account.upgrade.button"
                      className="w-full"
                      onClick={() => setUpgradeDialogOpen(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade to {TIER_LABELS[upgradeTarget]}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {UPGRADE_PRICES[upgradeTarget]} · Cancel anytime
                    </p>
                  </div>
                </div>
              )}

              {/* Stripe config notice for admins */}
              {isAdmin && stripeConfigured === false && (
                <div className="rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-500/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      Stripe not configured
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-500/20"
                      onClick={() => setStripeSetupOpen(true)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              )}

              {/* Platform Branding (admin-only collapsible) */}
              <Separator />
              <BrandingConfigPanel />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Upgrade confirmation dialog */}
      <AlertDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <AlertDialogContent data-ocid="account.upgrade.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Upgrade to {upgradeTarget ? TIER_LABELS[upgradeTarget] : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              You'll be redirected to Stripe to complete your payment of{" "}
              <strong>
                {upgradeTarget ? UPGRADE_PRICES[upgradeTarget] : ""}
              </strong>
              .
              {upgradeTarget === SubscriptionTier.starter
                ? " Starter plan includes up to 20 projects and advanced features."
                : " Pro plan includes unlimited projects and all features."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="account.upgrade.cancel_button"
              disabled={checkingOut}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="account.upgrade.confirm_button"
              onClick={handleUpgradeConfirm}
              disabled={checkingOut}
            >
              {checkingOut ? "Redirecting..." : "Continue to Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stripe setup dialog */}
      <StripeSetup open={stripeSetupOpen} onOpenChange={setStripeSetupOpen} />
    </>
  );
}

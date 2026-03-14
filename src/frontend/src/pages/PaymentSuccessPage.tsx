import { SubscriptionTier } from "@/backend";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import {
  useGetStripeSessionStatus,
  useUpgradeSubscription,
} from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function getQueryParam(key: string): string {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? "";
}

function parseTier(tierStr: string): SubscriptionTier | null {
  if (tierStr === "starter") return SubscriptionTier.starter;
  if (tierStr === "pro") return SubscriptionTier.pro;
  return null;
}

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const sessionId = getQueryParam("session_id");
  const tierStr = getQueryParam("tier");
  const tier = parseTier(tierStr);

  const [upgradeState, setUpgradeState] = useState<
    "idle" | "upgrading" | "done" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const upgradeCalled = useRef(false);

  const { data: sessionStatus } = useGetStripeSessionStatus(sessionId);
  const upgradeSubscription = useUpgradeSubscription();

  useEffect(() => {
    if (
      sessionStatus?.__kind__ === "completed" &&
      tier &&
      upgradeState === "idle" &&
      !upgradeCalled.current
    ) {
      upgradeCalled.current = true;
      setUpgradeState("upgrading");

      upgradeSubscription
        .mutateAsync(tier)
        .then(async () => {
          // Complete onboarding if not already completed
          if (actor) {
            try {
              const onboardingState = await actor.getMyOnboardingState();
              if (onboardingState && onboardingState.completedAt.length === 0) {
                await actor.updateOnboardingStep(3n);
                await actor.completeOnboarding();
              }
            } catch {
              // Non-fatal: onboarding completion is best-effort on payment path
            }
          }
          setUpgradeState("done");
          setTimeout(() => {
            navigate({ to: "/" });
          }, 2000);
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Failed to apply subscription";
          setErrorMessage(msg);
          setUpgradeState("error");
        });
    }

    if (sessionStatus?.__kind__ === "failed") {
      setErrorMessage(
        sessionStatus.failed.error || "Payment failed. Please try again.",
      );
      setUpgradeState("error");
    }
  }, [sessionStatus, tier, upgradeState, navigate, upgradeSubscription, actor]);

  if (!sessionId || !tier) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <div
          className="text-center max-w-md"
          data-ocid="payment.success.error_state"
        >
          <div className="rounded-full bg-destructive/10 p-5 inline-flex mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid Payment Link</h1>
          <p className="text-muted-foreground mb-6">
            This payment link is missing required parameters. Please try the
            upgrade flow again.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>Return Home</Button>
        </div>
      </div>
    );
  }

  if (upgradeState === "done") {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <div
          className="text-center max-w-md"
          data-ocid="payment.success.success_state"
        >
          <div className="rounded-full bg-primary/10 p-5 inline-flex mb-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Subscription Upgraded!</h1>
          <p className="text-muted-foreground mb-2">
            Your plan has been upgraded to{" "}
            <strong className="text-foreground capitalize">{tierStr}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (upgradeState === "error") {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <div
          className="text-center max-w-md"
          data-ocid="payment.success.error_state"
        >
          <div className="rounded-full bg-destructive/10 p-5 inline-flex mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
          <p className="text-muted-foreground mb-6">
            {errorMessage ||
              "We couldn't confirm your payment. Please contact support."}
          </p>
          <Button onClick={() => navigate({ to: "/" })}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Loading / pending state
  return (
    <div className="container flex items-center justify-center min-h-[60vh]">
      <div
        className="text-center max-w-md"
        data-ocid="payment.success.loading_state"
      >
        <div className="rounded-full bg-primary/10 p-5 inline-flex mb-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Confirming Your Payment</h1>
        <p className="text-muted-foreground">
          {upgradeState === "upgrading"
            ? "Activating your new plan..."
            : "Please wait while we confirm your payment with Stripe..."}
        </p>
      </div>
    </div>
  );
}

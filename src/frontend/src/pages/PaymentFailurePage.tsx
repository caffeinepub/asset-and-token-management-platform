import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="container flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md" data-ocid="payment.failure.panel">
        <div className="rounded-full bg-destructive/10 p-5 inline-flex mb-4">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-2">
          Your payment was cancelled or could not be completed.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          No charges were made. You can try again at any time from your account
          settings.
        </p>
        <Button
          data-ocid="payment.failure.home.link"
          onClick={() => navigate({ to: "/" })}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}

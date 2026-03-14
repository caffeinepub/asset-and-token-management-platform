import { ProjectRole, type ShoppingItem, SubscriptionTier } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddProjectMember,
  useCompleteOnboarding,
  useCreateCheckoutSession,
  useCreateProject,
  useUpdateOnboardingStep,
} from "@/hooks/useQueries";
import { Principal } from "@dfinity/principal";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Rocket,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface OnboardingWizardProps {
  initialStep?: number;
  hasCompleted?: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 3;

const planFeatures = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    projects: "3 projects",
    features: [
      "Basic asset management",
      "File metadata storage",
      "Community support",
    ],
    recommended: false,
    icon: Rocket,
    tier: SubscriptionTier.free,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$12",
    period: "per month",
    projects: "20 projects",
    features: [
      "Everything in Free",
      "Token minting",
      "Priority support",
      "Audit logs",
    ],
    recommended: true,
    icon: Zap,
    tier: SubscriptionTier.starter,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39",
    period: "per month",
    projects: "Unlimited projects",
    features: [
      "Everything in Starter",
      "Advanced RBAC",
      "Custom branding",
      "Dedicated support",
    ],
    recommended: false,
    icon: Sparkles,
    tier: SubscriptionTier.pro,
  },
];

export default function OnboardingWizard({
  initialStep = 1,
  hasCompleted = false,
  onClose,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [wizardProjectId, setWizardProjectId] = useState<bigint | null>(null);
  const [projectName, setProjectName] = useState("");
  const [collaboratorPrincipal, setCollaboratorPrincipal] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createProject = useCreateProject();
  const updateStep = useUpdateOnboardingStep();
  const completeOnboarding = useCompleteOnboarding();
  const addProjectMember = useAddProjectMember();
  const createCheckoutSession = useCreateCheckoutSession();

  const clearError = () => setError("");

  // Step 1: Create project
  async function handleCreateProject() {
    if (!projectName.trim()) {
      setError("Please enter a project name.");
      return;
    }
    clearError();
    setIsLoading(true);
    try {
      const projectId = await createProject.mutateAsync({
        name: projectName.trim(),
        description: "",
      });
      await updateStep.mutateAsync(1n);
      setWizardProjectId(projectId);
      setCurrentStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: Invite collaborator
  async function handleInviteCollaborator() {
    if (!collaboratorPrincipal.trim()) {
      setError("Please enter a principal ID.");
      return;
    }
    if (!wizardProjectId) {
      setError("No project found. Please go back and create one.");
      return;
    }
    clearError();
    setIsLoading(true);
    try {
      const member = Principal.fromText(collaboratorPrincipal.trim());
      await addProjectMember.mutateAsync({
        projectId: wizardProjectId,
        member,
        role: ProjectRole.editor,
      });
      await updateStep.mutateAsync(2n);
      setCurrentStep(3);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to invite collaborator",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Step 3: Choose plan
  async function handleFreePlan() {
    clearError();
    setIsLoading(true);
    try {
      await updateStep.mutateAsync(3n);
      await completeOnboarding.mutateAsync();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePaidPlan(tier: "starter" | "pro") {
    clearError();
    setIsLoading(true);
    try {
      const successUrl = `${window.location.origin}/payment-success?tier=${tier}`;
      const cancelUrl = `${window.location.origin}/payment-failure`;
      const items: ShoppingItem[] = [
        {
          productName: tier === "starter" ? "Starter Plan" : "Pro Plan",
          productDescription:
            tier === "starter" ? "Starter subscription" : "Pro subscription",
          currency: "usd",
          priceInCents: tier === "starter" ? 1200n : 3900n,
          quantity: 1n,
        },
      ];
      const session = await createCheckoutSession.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });
      window.location.href = session.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start checkout");
      setIsLoading(false);
    }
  }

  async function handleSkipStep3() {
    clearError();
    setIsLoading(true);
    try {
      await completeOnboarding.mutateAsync();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="onboarding.modal"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border overflow-hidden"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/60">
          <div
            className="flex items-center gap-3"
            data-ocid="onboarding.step_indicator"
          >
            <div className="flex gap-1.5">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={`step-dot-${stepNum}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    stepNum < currentStep
                      ? "w-6 bg-primary"
                      : stepNum === currentStep
                        ? "w-8 bg-primary"
                        : "w-4 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
          </div>

          {hasCompleted && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              data-ocid="onboarding.skip.button"
            >
              Skip setup
            </button>
          )}
        </div>

        {/* Step content */}
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                data-ocid="onboarding.step1.panel"
              >
                <div className="mb-5">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                    <Rocket className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Create Your First Project
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Projects are containers for your assets, tasks, and
                    collections.
                  </p>
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="e.g. My Creative Project"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      clearError();
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleCreateProject()
                    }
                    disabled={isLoading}
                    data-ocid="onboarding.step1.input"
                  />

                  {error && (
                    <p
                      className="text-sm text-destructive"
                      data-ocid="onboarding.error_state"
                    >
                      {error}
                    </p>
                  )}

                  {isLoading && (
                    <div
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      data-ocid="onboarding.loading_state"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating project...
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      onClick={handleCreateProject}
                      disabled={isLoading || !projectName.trim()}
                      className="w-full"
                      data-ocid="onboarding.step1.submit_button"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      ) : null}
                      Create Project
                      {!isLoading && <ChevronRight className="ml-1 w-4 h-4" />}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        clearError();
                        setCurrentStep(2);
                      }}
                      disabled={isLoading}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                      data-ocid="onboarding.step1.secondary_button"
                    >
                      Skip this step
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                data-ocid="onboarding.step2.panel"
              >
                <div className="mb-5">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Invite a Collaborator
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Add a team member to collaborate on your project.
                  </p>
                </div>

                <div className="space-y-3">
                  {wizardProjectId === null ? (
                    <>
                      <div className="rounded-lg bg-muted/60 border border-border px-3 py-2.5">
                        <p className="text-sm text-muted-foreground">
                          Create a project first to invite a collaborator.
                        </p>
                      </div>
                      <Input
                        placeholder="Principal ID (e.g. aaaaa-aa)"
                        disabled
                        data-ocid="onboarding.step2.input"
                      />
                      <Button
                        disabled
                        className="w-full"
                        data-ocid="onboarding.step2.submit_button"
                      >
                        Send Invite
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        placeholder="Principal ID (e.g. aaaaa-aa)"
                        value={collaboratorPrincipal}
                        onChange={(e) => {
                          setCollaboratorPrincipal(e.target.value);
                          clearError();
                        }}
                        disabled={isLoading}
                        data-ocid="onboarding.step2.input"
                      />
                      {error && (
                        <p
                          className="text-sm text-destructive"
                          data-ocid="onboarding.error_state"
                        >
                          {error}
                        </p>
                      )}
                      {isLoading && (
                        <div
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                          data-ocid="onboarding.loading_state"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending invite...
                        </div>
                      )}
                      <Button
                        onClick={handleInviteCollaborator}
                        disabled={isLoading || !collaboratorPrincipal.trim()}
                        className="w-full"
                        data-ocid="onboarding.step2.submit_button"
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        ) : null}
                        Send Invite
                        {!isLoading && (
                          <ChevronRight className="ml-1 w-4 h-4" />
                        )}
                      </Button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setCurrentStep(3);
                    }}
                    disabled={isLoading}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 w-full text-center"
                    data-ocid="onboarding.step2.secondary_button"
                  >
                    Skip this step
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                data-ocid="onboarding.step3.panel"
              >
                <div className="mb-5">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Choose Your Plan
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    You can upgrade or change your plan at any time.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {planFeatures.map((plan, idx) => {
                    const Icon = plan.icon;
                    const ocid = `onboarding.step3.item.${idx + 1}` as const;
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                          plan.recommended
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                        data-ocid={ocid}
                      >
                        {plan.recommended && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                              Recommended
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col items-center text-center gap-1 pt-1">
                          <Icon
                            className={`w-5 h-5 ${
                              plan.recommended
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="font-semibold text-sm text-foreground">
                            {plan.name}
                          </span>
                          <span className="text-lg font-bold text-foreground leading-none">
                            {plan.price}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {plan.period}
                          </span>
                          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {plan.projects}
                          </span>
                        </div>

                        <ul className="space-y-1">
                          {plan.features.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-1 text-[10px] text-muted-foreground"
                            >
                              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        <Button
                          size="sm"
                          variant={plan.recommended ? "default" : "outline"}
                          className="w-full text-xs mt-auto"
                          disabled={isLoading}
                          onClick={() => {
                            if (plan.id === "free") handleFreePlan();
                            else if (plan.id === "starter")
                              handlePaidPlan("starter");
                            else handlePaidPlan("pro");
                          }}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : plan.id === "free" ? (
                            "Continue Free"
                          ) : (
                            `Upgrade to ${plan.name}`
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <p
                    className="text-sm text-destructive mb-3"
                    data-ocid="onboarding.error_state"
                  >
                    {error}
                  </p>
                )}
                {isLoading && (
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground mb-3"
                    data-ocid="onboarding.loading_state"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSkipStep3}
                  disabled={isLoading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 w-full text-center"
                  data-ocid="onboarding.step3.secondary_button"
                >
                  Skip this step
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { usePlatformConfig } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

export default function LandingPage() {
  const { identity, isInitializing, login, isLoginSuccess, isLoggingIn } =
    useInternetIdentity();
  const navigate = useNavigate();
  const { platformName, tagline, accentColor, isLoading } = usePlatformConfig();

  // Already authenticated → redirect immediately
  useEffect(() => {
    if (!isInitializing && identity) {
      navigate({ to: "/" });
    }
  }, [isInitializing, identity, navigate]);

  // Login success → redirect to dashboard
  useEffect(() => {
    if (isLoginSuccess) {
      navigate({ to: "/" });
    }
  }, [isLoginSuccess, navigate]);

  // While initializing auth or if already authenticated, render nothing
  if (isInitializing || (!isInitializing && identity)) {
    return null;
  }

  return (
    <div
      data-ocid="landing.page"
      className="landing-page fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background layers */}
      <div className="landing-bg-base absolute inset-0" />
      <div className="landing-bg-glow absolute inset-0" />
      <div className="landing-bg-grid absolute inset-0 opacity-[0.03]" />

      {/* Decorative orbs */}
      <motion.div
        className="landing-orb-1 absolute"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{ background: accentColor }}
      />
      <motion.div
        className="landing-orb-2 absolute"
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{ background: accentColor }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              data-ocid="landing.loading_state"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Skeleton className="h-14 w-72 rounded-xl bg-white/10" />
              <Skeleton className="h-5 w-48 rounded-lg bg-white/8" />
              <Skeleton className="mt-6 h-12 w-56 rounded-full bg-white/10" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="flex flex-col items-center gap-5"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Shield icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "backOut" }}
                className="landing-icon-ring mb-2 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ color: accentColor }}
              >
                <ShieldCheck className="h-8 w-8" />
              </motion.div>

              {/* Platform name */}
              <motion.h1
                data-ocid="landing.platform_name.section"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="landing-heading font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
                style={{ color: accentColor }}
              >
                {platformName}
              </motion.h1>

              {/* Tagline */}
              {tagline && (
                <motion.p
                  data-ocid="landing.tagline.section"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.25,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="landing-tagline max-w-md text-lg sm:text-xl"
                >
                  {tagline}
                </motion.p>
              )}
              {!tagline && (
                <div data-ocid="landing.tagline.section" className="sr-only" />
              )}

              {/* CTA button */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.35,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-4"
              >
                <Button
                  data-ocid="landing.login.button"
                  size="lg"
                  disabled={isLoggingIn}
                  onClick={login}
                  className="landing-cta h-13 rounded-full px-8 text-base font-semibold"
                  style={{
                    background: accentColor,
                    color: "#fff",
                    boxShadow: `0 0 32px ${accentColor}55`,
                  }}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign In with Internet Identity"
                  )}
                </Button>
              </motion.div>

              {/* Footer note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="landing-footnote mt-2 text-xs"
              >
                Secured by Internet Identity — no passwords required
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom attribution */}
      <div className="landing-attribution absolute bottom-6 text-xs">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="landing-attribution-link underline-offset-2 hover:underline"
        >
          Built with love using caffeine.ai
        </a>
      </div>
    </div>
  );
}

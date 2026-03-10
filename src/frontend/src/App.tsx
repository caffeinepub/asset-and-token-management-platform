import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import AssetsPage from "@/pages/AssetsPage";
import AuditLogPage from "@/pages/AuditLogPage";
import CollectionsPage from "@/pages/CollectionsPage";
import FileMetadataPage from "@/pages/FileMetadataPage";
import LandingPage from "@/pages/LandingPage";
import PaymentFailurePage from "@/pages/PaymentFailurePage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import ProjectsPage from "@/pages/ProjectsPage";
import TasksPage from "@/pages/TasksPage";
import TokensPage from "@/pages/TokensPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

const queryClient = new QueryClient();

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/** Guards the root "/" route — redirects unauthenticated visitors to "/landing" */
function ProtectedIndex() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: "/landing" });
    }
  }, [isInitializing, identity, navigate]);

  if (isInitializing || !identity) return null;
  return <ProjectsPage />;
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ProtectedIndex,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/landing",
  component: LandingPage,
});

const assetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/assets/$projectId",
  component: AssetsPage,
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tasks/$projectId",
  component: TasksPage,
});

const collectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/collections/$projectId",
  component: CollectionsPage,
});

const tokensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tokens/$projectId",
  component: TokensPage,
});

const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/files/$projectId",
  component: FileMetadataPage,
});

const auditLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit-log",
  component: AuditLogPage,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-success",
  component: PaymentSuccessPage,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-failure",
  component: PaymentFailurePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  landingRoute,
  assetsRoute,
  tasksRoute,
  collectionsRoute,
  tokensRoute,
  filesRoute,
  auditLogRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

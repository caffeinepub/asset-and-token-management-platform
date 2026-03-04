import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import AssetsPage from "@/pages/AssetsPage";
import AuditLogPage from "@/pages/AuditLogPage";
import CollectionsPage from "@/pages/CollectionsPage";
import FileMetadataPage from "@/pages/FileMetadataPage";
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
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";

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

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ProjectsPage,
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  assetsRoute,
  tasksRoute,
  collectionsRoute,
  tokensRoute,
  filesRoute,
  auditLogRoute,
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

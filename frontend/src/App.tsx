import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectsPage from '@/pages/ProjectsPage';
import AssetsPage from '@/pages/AssetsPage';
import TasksPage from '@/pages/TasksPage';
import CollectionsPage from '@/pages/CollectionsPage';
import TokensPage from '@/pages/TokensPage';
import FileMetadataPage from '@/pages/FileMetadataPage';

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
  path: '/',
  component: ProjectsPage,
});

const assetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/assets/$projectId',
  component: AssetsPage,
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks/$projectId',
  component: TasksPage,
});

const collectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collections/$projectId',
  component: CollectionsPage,
});

const tokensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tokens/$projectId',
  component: TokensPage,
});

const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/files/$projectId',
  component: FileMetadataPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  assetsRoute,
  tasksRoute,
  collectionsRoute,
  tokensRoute,
  filesRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
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

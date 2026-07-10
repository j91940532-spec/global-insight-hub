import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-7xl font-bold text-accent-cyan">404</h1>
        <p className="mt-4 font-mono text-xs text-zinc-500 tracking-widest">
          SIGNAL LOST — RESOURCE NOT FOUND
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 font-mono text-xs text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
            style={{ border: "1px solid var(--border-hair)" }}
          >
            RETURN TO BASE
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs text-accent-amber tracking-widest">SYSTEM FAULT</p>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          Something went wrong. Retry or return home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="px-4 py-2 font-mono text-xs text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
            style={{ border: "1px solid var(--border-hair)" }}
          >
            RETRY
          </button>
          <a
            href="/"
            className="px-4 py-2 font-mono text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            style={{ border: "1px solid var(--border-hair)" }}
          >
            HOME
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Orbital/Ops — Global Intelligence Console" },
      {
        name: "description",
        content:
          "Real-time global operations console with 3D globe, intelligence layers, and chokepoint monitoring.",
      },
      { property: "og:title", content: "Orbital/Ops — Global Intelligence Console" },
      {
        property: "og:description",
        content: "Real-time global operations console with 3D globe and intelligence layers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="font-mono text-xs text-accent-amber">
          MISSING VITE_CLERK_PUBLISHABLE_KEY
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

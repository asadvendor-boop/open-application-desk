"use client";

import dynamic from "next/dynamic";

const ApplicationWorkspace = dynamic(
  () =>
    import("@/components/application-workspace").then(
      (module) => module.ApplicationWorkspace,
    ),
  {
    ssr: false,
    loading: () => (
      <main className="loading-workspace" aria-live="polite">
        <span>OA / 01</span>
        <p>Opening the browser-local application workspace…</p>
      </main>
    ),
  },
);

export default function Home() {
  return <ApplicationWorkspace />;
}

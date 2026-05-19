"use client";

// React Root-Error-Boundary. Faengt Errors die so frueh im Render-Tree
// passieren, dass nicht mal app/layout.tsx mehr greift. Pflicht-Datei
// fuer Sentry-Next.js-Setup im App-Router.

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}

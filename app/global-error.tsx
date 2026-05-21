"use client";

// React Root-Error-Boundary. Faengt Errors die so frueh im Render-Tree
// passieren, dass nicht mal app/layout.tsx mehr greift.

import NextError from "next/error";

export default function GlobalError() {
  return (
    <html lang="de">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import { parseDSLString } from "../lib/dslparser"; // adjust path
import type { Patch } from "../lib/types";

export default function Home() {
  const [dslInput, setDslInput] = useState("");
  const [output, setOutput] = useState<Patch[] | null>(null);
  const [error, setError] = useState("");

  const handleParse = () => {
    try {
      setError("");
      const patches = parseDSLString(dslInput); // <-- use your DSL parser
      setOutput(patches);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOutput(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <main className="w-full max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">  
          DSL Parser Tester
        </h1>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            DSL Input (one command per line):
          </label>
          <textarea
            value={dslInput}
            onChange={(e) => setDslInput(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 p-4 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            rows={10}
            placeholder="AT feature_id ACTION {json_content}"
          />
        </div>

        <button
          onClick={handleParse}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Parse DSL
        </button>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <strong>Error:</strong> {error}
          </div>
        )}

        {output && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Parsed Output (JSON with edges):
            </label>
            <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
              <code className="text-zinc-800 dark:text-zinc-200">
                {JSON.stringify(output, null, 2)}
              </code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}

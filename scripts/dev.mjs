/**
 * `npm run dev` — the Next dev server, with the content watcher beside it.
 *
 * Two processes rather than one so neither can take the other down: if the
 * watcher cannot reach Supabase it keeps complaining into the log while the
 * site carries on serving the files already on disk, which is the same thing a
 * build does.
 *
 * Written here rather than pulled in as `concurrently`: it is forty lines, and
 * a dependency that only runs on a developer's machine is still a dependency
 * to keep current.
 */

import { spawn } from "node:child_process";
import { createRequire } from "node:module";

/*
 * Next is started by running its own entry file under this Node, not by
 * spawning `next` or `npx`.
 *
 * On Windows those are .cmd shims, and current Node refuses to spawn a .cmd
 * without shell: true — that is the EINVAL this used to throw. Turning the
 * shell on would fix the error and import its quoting rules, so instead the
 * package's real JavaScript entry is resolved and handed to process.execPath,
 * which needs no shell on any platform.
 */
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const children = [];

function start(name, args) {
  const child = spawn(process.execPath, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });

  const prefix = `[${name}]`;
  const forward = (stream, to) => {
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) to.write(line ? `${prefix} ${line}\n` : "\n");
    });
  };

  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);

  child.on("exit", (code) => {
    /* Next exiting means the session is over; the watcher exiting on its own
       is a bug worth seeing, but not worth killing the dev server for. */
    if (name === "next") {
      stopAll();
      process.exit(code ?? 0);
    } else {
      console.error(`${prefix} stopped (${code}). Content will not refresh until you restart.`);
    }
  });

  children.push(child);
  return child;
}

function stopAll() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopAll();
    process.exit(0);
  });
}

start("next", [nextBin, "dev"]);
start("content", ["scripts/db-watch.mjs"]);

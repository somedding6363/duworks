import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { read, root } from "./test-utils.mjs";

function collectTypeScriptFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return collectTypeScriptFiles(path);
    return /\.(?:ts|tsx)$/.test(entry) ? [path] : [];
  });
}

function getImports(source) {
  return [...source.matchAll(/(?:from\s+|import\s*\()["']([^"']+)["']/g)].map(([, path]) => path);
}

test("keeps route, page, widget, entity, and shared imports on valid FSD boundaries", () => {
  const routeImports = getImports(read("src/app/page.tsx"));
  const pageImports = getImports(read("src/_pages/home/ui/home-page.tsx"));

  assert.deepEqual(
    routeImports.filter((path) => path.startsWith("@/_pages/")),
    ["@/_pages/home"],
  );

  const widgetImports = pageImports.filter((path) => path.startsWith("@/widgets/"));
  assert.ok(widgetImports.length > 0, "The home page must compose widget public APIs.");
  assert.equal(
    widgetImports.every((path) => /^@\/widgets\/[^/]+$/.test(path)),
    true,
    "Pages must not import widget internals.",
  );

  const widgets = collectTypeScriptFiles(join(root, "src/widgets"));
  const widgetLayerImports = widgets.flatMap((file) => getImports(readFileSync(file, "utf8")));
  const entityImports = widgetLayerImports.filter((path) => path.startsWith("@/entities/"));

  assert.ok(entityImports.length > 0, "Widgets must consume the service entity.");
  assert.equal(
    entityImports.every((path) => /^@\/entities\/[^/]+$/.test(path)),
    true,
    "Widgets must not import entity internals.",
  );
  assert.equal(
    widgetLayerImports.some((path) => path.startsWith("@/_pages/") || path.startsWith("@/app/")),
    false,
    "Widgets must not import upper layers.",
  );

  const entities = collectTypeScriptFiles(join(root, "src/entities"));
  const entityLayerImports = entities.flatMap((file) => getImports(readFileSync(file, "utf8")));
  assert.equal(
    entityLayerImports.some(
      (path) =>
        path.startsWith("@/widgets/") || path.startsWith("@/_pages/") || path.startsWith("@/app/"),
    ),
    false,
    "Entities must not import upper layers.",
  );

  const shared = collectTypeScriptFiles(join(root, "src/shared"));
  const sharedLayerImports = shared.flatMap((file) => getImports(readFileSync(file, "utf8")));
  assert.equal(
    sharedLayerImports.some((path) =>
      ["@/entities/", "@/features/", "@/widgets/", "@/_pages/", "@/app/"].some((prefix) =>
        path.startsWith(prefix),
      ),
    ),
    false,
    "Shared code must not import upper layers.",
  );
});

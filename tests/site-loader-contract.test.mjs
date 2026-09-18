import assert from "node:assert/strict";
import test from "node:test";

import { getAttribute, read, readOutput } from "./test-utils.mjs";

test("renders the first-view loader with an accessible progress contract", () => {
  const html = readOutput("index.html");
  const loader = html.match(/<div\b[^>]*data-site-loader="[^"]*"[^>]*>/i)?.[0];

  assert.ok(loader, "The exported home page must include the first-view loader.");
  assert.equal(getAttribute(loader, "role"), "progressbar");
  assert.equal(getAttribute(loader, "aria-valuemin"), "0");
  assert.equal(getAttribute(loader, "aria-valuemax"), "100");
  assert.equal(getAttribute(loader, "aria-valuenow"), "0");
  assert.match(html, /data-site-content="[^"]*"/i, "The page content must expose a lock target.");
});

test("ties loader completion to page readiness and restores interaction", () => {
  const source = read("src/_pages/home/ui/site-loader.tsx");

  assert.doesNotMatch(source, /\.module\.css/);
  assert.match(source, /document\.readyState === "complete"/);
  assert.match(source, /window\.addEventListener\("load"/);
  assert.match(source, /pageContent\?\.setAttribute\("inert", ""\)/);
  assert.match(source, /pageContent\?\.removeAttribute\("inert"\)/);
  assert.match(source, /currentProgress >= 100/);
});

test("shows the loader on every full page load", () => {
  const source = read("src/_pages/home/ui/site-loader.tsx");

  assert.match(source, /useState<LoaderPhase>\("loading"\)/);
  assert.doesNotMatch(source, /sessionStorage/);
  assert.doesNotMatch(source, /localStorage/);
  assert.doesNotMatch(source, /LOADER_BOOTSTRAP_SCRIPT/);
});

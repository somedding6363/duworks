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

test("shows the loader once per browser tab without a repeat-view flash", () => {
  const source = read("src/_pages/home/ui/site-loader.tsx");

  assert.match(source, /window\.sessionStorage\.getItem\(LOADER_STORAGE_KEY\)/);
  assert.match(source, /window\.sessionStorage\.setItem\(LOADER_STORAGE_KEY, "true"\)/);
  assert.match(
    source,
    /document\.currentScript\?\.parentElement\?\.setAttribute\("hidden",\s*""\)/,
  );
  assert.match(source, /suppressHydrationWarning/);
  assert.match(source, /typeof window === "undefined" \? "text\/javascript" : "text\/plain"/);
  assert.doesNotMatch(source, /document\.documentElement\.toggleAttribute/);
  assert.doesNotMatch(source, /data-site-loader-seen/);
  assert.doesNotMatch(source, /localStorage/);
});

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { collectFiles, getAttribute, outputRoot, readOutput } from "./test-utils.mjs";

const siteUrl = "https://duworks.kr/";
const siteTitle = "DUWORKS";
const siteDescription = "DUWORKS는 상상을 현실로 옮기고 그 결과를 세상에 내놓습니다.";
const tagManagerId = "GTM-NQHQ5GRM";

test("exports every file required by the static deployment", () => {
  const requiredFiles = [
    "index.html",
    "robots.txt",
    "sitemap.xml",
    "manifest.webmanifest",
    "_headers",
  ];

  for (const file of requiredFiles) {
    const path = join(outputRoot, file);
    assert.equal(existsSync(path), true, `Missing out/${file}.`);
    assert.ok(statSync(path).size > 0, `out/${file} must not be empty.`);
  }
});

test("publishes canonical SEO metadata and WebSite structured data", () => {
  const html = readOutput("index.html");
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(([tag]) => tag);
  const findTag = (attribute, value) =>
    tags.find((tag) => getAttribute(tag, attribute) === value) ?? "";

  assert.equal(getAttribute(htmlTag, "lang"), "ko");
  assert.equal(html.match(/<title>(.*?)<\/title>/i)?.[1], siteTitle);
  assert.equal(getAttribute(findTag("rel", "canonical"), "href"), siteUrl);
  assert.equal(getAttribute(findTag("name", "description"), "content"), siteDescription);
  assert.equal(getAttribute(findTag("property", "og:url"), "content"), siteUrl);
  assert.equal(getAttribute(findTag("property", "og:title"), "content"), siteTitle);
  assert.equal(getAttribute(findTag("property", "og:description"), "content"), siteDescription);
  assert.equal(getAttribute(findTag("name", "twitter:card"), "content"), "summary_large_image");
  assert.equal(getAttribute(findTag("name", "twitter:title"), "content"), siteTitle);
  assert.equal(getAttribute(findTag("name", "twitter:description"), "content"), siteDescription);

  const structuredDataMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  );
  assert.ok(structuredDataMatch, "WebSite JSON-LD must be rendered.");

  const structuredData = JSON.parse(structuredDataMatch[1]);
  assert.equal(structuredData["@context"], "https://schema.org");
  assert.equal(structuredData["@type"], "WebSite");
  assert.equal(structuredData.name, "DUWORKS");
  assert.deepEqual(structuredData.alternateName, ["두웍스", "duworks.kr"]);
  assert.equal(structuredData.url, siteUrl);
  assert.equal(structuredData.inLanguage, "ko-KR");
});

test("keeps robots, sitemap, and manifest aligned with the production origin", () => {
  const robots = readOutput("robots.txt");
  const sitemap = readOutput("sitemap.xml");
  const manifest = JSON.parse(readOutput("manifest.webmanifest"));

  assert.match(robots, /^User-Agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/duworks\.kr\/sitemap\.xml$/m);
  assert.match(sitemap, /<loc>https:\/\/duworks\.kr\/<\/loc>/);
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, 1);

  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.lang, "ko");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);

  for (const icon of manifest.icons) {
    assert.match(icon.src, /^\//);
    assert.equal(existsSync(join(outputRoot, icon.src.slice(1))), true, `Missing ${icon.src}.`);
  }
});

test("renders one GTM loader and its noscript fallback without a duplicate gtag install", () => {
  const html = readOutput("index.html");
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? "";
  const headScripts = [...head.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(
    ([, content]) => content,
  );
  const tagManagerScripts = headScripts.filter((content) =>
    content.includes("googletagmanager.com/gtm.js"),
  );
  const tagManagerFallbacks = [...body.matchAll(/<noscript>([\s\S]*?)<\/noscript>/gi)]
    .map(([, content]) => content)
    .filter((content) => content.includes("googletagmanager.com/ns.html"));

  assert.equal(tagManagerScripts.length, 1);
  assert.match(tagManagerScripts[0], new RegExp(tagManagerId));
  assert.equal(tagManagerFallbacks.length, 1);
  assert.match(tagManagerFallbacks[0], new RegExp(tagManagerId));
  assert.doesNotMatch(head, /googletagmanager\.com\/gtag\/js/);
});

test("authorizes every exported inline script with a bounded hash-based CSP", async () => {
  const headers = readOutput("_headers");
  const requiredHeaders = [
    "Strict-Transport-Security: max-age=31536000",
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: DENY",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy:",
    "Cross-Origin-Opener-Policy: same-origin",
  ];

  for (const header of requiredHeaders) assert.match(headers, new RegExp(header));

  const policyLine = headers
    .split("\n")
    .find((line) => line.trimStart().startsWith("Content-Security-Policy:"));
  assert.ok(policyLine, "A generated Content-Security-Policy header is required.");
  assert.ok(policyLine.length <= 2_000, "The CSP must stay within Cloudflare's line limit.");

  const policy = policyLine.trim();
  const scriptSource = policy.match(/script-src ([^;]+)/)?.[1] ?? "";
  const connectSource = policy.match(/connect-src ([^;]+)/)?.[1] ?? "";
  const imageSource = policy.match(/img-src ([^;]+)/)?.[1] ?? "";
  assert.doesNotMatch(scriptSource, /'unsafe-inline'/);
  assert.match(scriptSource, /https:\/\/www\.googletagmanager\.com/);
  assert.match(connectSource, /https:\/\/\*\.google-analytics\.com/);
  assert.match(connectSource, /https:\/\/\*\.analytics\.google\.com/);
  assert.match(connectSource, /https:\/\/www\.googletagmanager\.com/);
  assert.match(imageSource, /https:\/\/\*\.google-analytics\.com/);
  assert.doesNotMatch(imageSource, /https:\/\/\*\.analytics\.google\.com/);
  assert.match(imageSource, /https:\/\/www\.googletagmanager\.com/);

  const inlineHashes = new Set();
  const htmlFiles = collectFiles(outputRoot).filter((file) => file.endsWith(".html"));

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");

    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const [, attributes, content] = match;
      if (/\bsrc\s*=/i.test(attributes) || content.length === 0) continue;

      const digest = createHash("sha256").update(content).digest("base64");
      inlineHashes.add(`'sha256-${digest}'`);
    }
  }

  assert.ok(inlineHashes.size > 0, "At least one inline script hash must be generated.");
  for (const hash of inlineHashes)
    assert.match(scriptSource, new RegExp(hash.replace(/\+/g, "\\+")));
});

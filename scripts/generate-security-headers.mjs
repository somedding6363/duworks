import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const outputDirectory = join(process.cwd(), "out");
const headersPath = join(outputDirectory, "_headers");
const checkOnly = process.argv.includes("--check");
const cloudflareHeaderLineLimit = 2_000;

const externalSources = {
  analytics: {
    connect: ["https://*.google-analytics.com", "https://*.analytics.google.com"],
    image: ["https://*.google-analytics.com"],
  },
  tagManager: "https://www.googletagmanager.com",
};

async function getFiles(directory) {
  const entries = await readdir(directory);
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry);
      return (await stat(path)).isDirectory() ? getFiles(path) : [path];
    }),
  );

  return files.flat();
}

function getInlineScriptHashes(html) {
  const hashes = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const [, attributes, content] = match;
    if (/\bsrc\s*=/.test(attributes) || content.length === 0) continue;

    const digest = createHash("sha256").update(content).digest("base64");
    hashes.push(`'sha256-${digest}'`);
  }

  return hashes;
}

function createContentSecurityPolicy(scriptHashes) {
  const analyticsConnectSources = externalSources.analytics.connect.join(" ");
  const analyticsImageSources = externalSources.analytics.image.join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src 'self' ${analyticsConnectSources} ${externalSources.tagManager}`,
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `frame-src ${externalSources.tagManager}`,
    `img-src 'self' data: blob: ${analyticsImageSources} ${externalSources.tagManager}`,
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    `script-src 'self' ${scriptHashes.join(" ")} ${externalSources.tagManager}`,
    "style-src 'self' 'unsafe-inline'",
    "upgrade-insecure-requests",
    "worker-src 'self' blob:",
  ].join("; ");
}

function insertContentSecurityPolicy(headers, policy) {
  const headerLines = headers
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("Content-Security-Policy:"));
  const ruleIndex = headerLines.findIndex((line) => line.trim() === "/*");

  if (ruleIndex === -1) {
    throw new Error("out/_headers must contain a /* rule.");
  }

  headerLines.splice(ruleIndex + 1, 0, `  Content-Security-Policy: ${policy}`);
  return `${headerLines.join("\n").trimEnd()}\n`;
}

const files = await getFiles(outputDirectory);
const htmlFiles = files.filter((file) => file.endsWith(".html"));

if (htmlFiles.length === 0) {
  throw new Error("No exported HTML files were found. Run next build first.");
}

const scriptHashes = new Set();

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");
  getInlineScriptHashes(html).forEach((hash) => scriptHashes.add(hash));
}

if (scriptHashes.size === 0) {
  throw new Error("No inline scripts were found to authorize in the CSP.");
}

const policy = createContentSecurityPolicy([...scriptHashes].sort());
const contentSecurityPolicyLine = `  Content-Security-Policy: ${policy}`;

if (contentSecurityPolicyLine.length > cloudflareHeaderLineLimit) {
  throw new Error(
    `The CSP header is ${contentSecurityPolicyLine.length} characters; Cloudflare Pages allows ${cloudflareHeaderLineLimit}.`,
  );
}

const currentHeaders = await readFile(headersPath, "utf8");
const generatedHeaders = insertContentSecurityPolicy(currentHeaders, policy);

if (checkOnly) {
  if (currentHeaders !== generatedHeaders) {
    throw new Error("out/_headers is stale. Run npm run build to regenerate it.");
  }
} else {
  await writeFile(headersPath, generatedHeaders);
}

console.log(
  `${checkOnly ? "Verified" : "Generated"} ${relative(process.cwd(), headersPath)} with ${scriptHashes.size} inline script hashes.`,
);

import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { getAttribute, outputRoot, readOutput, readServiceCatalog, root } from "./test-utils.mjs";

const services = readServiceCatalog();

test("keeps every service entry complete, unique, and HTTPS-only", () => {
  assert.ok(services.length > 0, "At least one service must be published.");

  const requiredTextFields = ["name", "host", "href", "summary", "image", "imageAlt", "status"];

  for (const service of services) {
    for (const field of requiredTextFields) {
      assert.equal(
        typeof service[field],
        "string",
        `${service.name ?? "Unknown service"}.${field} must be a string.`,
      );
      assert.ok(
        service[field].trim(),
        `${service.name ?? "Unknown service"}.${field} must not be empty.`,
      );
    }

    const url = new URL(service.href);
    assert.equal(url.protocol, "https:", `${service.name} must use HTTPS.`);
    assert.equal(url.hostname, service.host, `${service.name} host and href must match.`);
  }

  for (const field of ["name", "host", "href"]) {
    const values = services.map((service) => service[field]);
    assert.equal(new Set(values).size, values.length, `Service ${field} values must be unique.`);
  }
});

test("keeps every referenced service image present and non-empty", () => {
  for (const service of services) {
    assert.match(
      service.image,
      /^\/images\/[\w-]+\.webp$/,
      `${service.name} must reference a WebP image.`,
    );

    const sourcePath = join(root, "public", service.image.slice(1));
    const outputPath = join(outputRoot, service.image.slice(1));

    assert.equal(existsSync(sourcePath), true, `Missing source image for ${service.name}.`);
    assert.ok(statSync(sourcePath).size > 0, `${service.name} source image must not be empty.`);
    assert.equal(existsSync(outputPath), true, `Missing exported image for ${service.name}.`);
  }
});

test("protects every exported service link opened in a new tab", () => {
  const html = readOutput("index.html");
  const anchors = [...html.matchAll(/<a\b[^>]*>/gi)].map(([tag]) => tag);

  for (const service of services) {
    const serviceAnchors = anchors.filter((tag) => getAttribute(tag, "href") === service.href);

    assert.ok(
      serviceAnchors.length >= 2,
      `${service.name} must be linked from its card and footer.`,
    );

    for (const anchor of serviceAnchors) {
      assert.equal(
        getAttribute(anchor, "target"),
        "_blank",
        `${service.name} must open in a new tab.`,
      );
      const rel = new Set((getAttribute(anchor, "rel") ?? "").split(/\s+/));
      assert.equal(rel.has("noopener"), true, `${service.name} must use noopener.`);
      assert.equal(rel.has("noreferrer"), true, `${service.name} must use noreferrer.`);
    }
  }
});

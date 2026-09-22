import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, isSafeUrl, normalizeWebsiteUrl, safeWebsiteHref } from "./formatting";
import { validateLogoFile } from "./imageProcessing";

// ---------------- XSS / HTML escaping ----------------

test("escapeHtml neutralizes script tags and attribute-breakout characters", () => {
  const input = `<script>alert(1)</script>"'&`;
  const out = escapeHtml(input);
  assert.ok(!out.includes("<script>"));
  assert.ok(!out.includes('"'));
  assert.ok(!out.includes("'"));
  assert.equal(out, "&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;&amp;");
});

// ---------------- URL validation ----------------

test("isSafeUrl accepts http/https and rejects dangerous schemes", () => {
  assert.equal(isSafeUrl("https://example.com"), true);
  assert.equal(isSafeUrl("http://example.com"), true);
  assert.equal(isSafeUrl("javascript:alert(1)"), false);
  assert.equal(isSafeUrl("data:text/html,<script>alert(1)</script>"), false);
  assert.equal(isSafeUrl("file:///etc/passwd"), false);
  assert.equal(isSafeUrl("not a url at all"), false);
});

test("normalizeWebsiteUrl adds https:// only when no scheme is present", () => {
  assert.equal(normalizeWebsiteUrl("example.com"), "https://example.com");
  assert.equal(normalizeWebsiteUrl("http://example.com"), "http://example.com");
  assert.equal(normalizeWebsiteUrl("  "), "");
});

test("normalizeWebsiteUrl does not launder a javascript: scheme into something safe-looking", () => {
  // it gets prefixed (becomes "https://javascript:alert(1)"), which is NOT
  // executable - but the resulting string must still fail isSafeUrl once
  // URL-parsed, not be silently accepted.
  const normalized = normalizeWebsiteUrl("javascript:alert(1)");
  assert.equal(isSafeUrl(normalized), false);
});

test("safeWebsiteHref rejects dangerous/malformed URLs outright", () => {
  assert.equal(safeWebsiteHref("javascript:alert(1)"), null);
  assert.equal(safeWebsiteHref(""), null);
  assert.equal(safeWebsiteHref("   "), null);
});

test("safeWebsiteHref HTML-escapes the result so it can't break out of an href attribute", () => {
  // the quote lands in the path (not the hostname, which the URL parser
  // would reject outright as an invalid host) - this is the realistic
  // shape of an attribute-breakout attempt against a URL field.
  const malicious = `https://evil.com/" onmouseover="alert(1)`;
  const href = safeWebsiteHref(malicious);
  assert.ok(href !== null);
  assert.ok(!href!.includes('"'), "escaped href must not contain a raw double-quote");
});

test("a hostname-breaking attribute-injection attempt is rejected outright (invalid URL)", () => {
  // no "/" before the quote means the URL parser treats the whole thing
  // as an (invalid) hostname and refuses to parse it at all.
  assert.equal(safeWebsiteHref(`https://evil.com" onmouseover="alert(1)`), null);
});

test("safeWebsiteHref accepts a normal website", () => {
  assert.equal(safeWebsiteHref("example.com"), "https://example.com");
});

// ---------------- Logo upload validation ----------------

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff, 0xe0];

function fakeFile(bytes: number[], type: string, name = "logo.png"): File {
  const padded = new Uint8Array(Math.max(bytes.length, 16));
  padded.set(bytes);
  return new File([padded], name, { type });
}

test("validateLogoFile rejects a disallowed MIME type outright (e.g. SVG)", async () => {
  const file = fakeFile(PNG_SIGNATURE, "image/svg+xml", "logo.svg");
  const error = await validateLogoFile(file);
  assert.ok(error);
});

test("validateLogoFile rejects a file over the size limit", async () => {
  const bigBytes = new Uint8Array(1024 * 1024 + 1);
  bigBytes.set(PNG_SIGNATURE);
  const file = new File([bigBytes], "logo.png", { type: "image/png" });
  const error = await validateLogoFile(file);
  assert.ok(error?.includes("too large"));
});

test("validateLogoFile rejects a spoofed MIME type whose bytes don't match (extension/MIME lying)", async () => {
  // client-reported type says PNG, but the actual bytes are plain text -
  // this is exactly the "don't trust file.type alone" case from the spec.
  const notReallyPng = new TextEncoder().encode("this is not an image, just text pretending to be one");
  const file = new File([notReallyPng], "logo.png", { type: "image/png" });
  const error = await validateLogoFile(file);
  assert.ok(error, "a file whose magic bytes don't match its claimed MIME type must be rejected");
});

test("validateLogoFile accepts a genuine PNG signature under the size limit", async () => {
  const file = fakeFile(PNG_SIGNATURE, "image/png");
  const error = await validateLogoFile(file);
  assert.equal(error, null);
});

test("validateLogoFile accepts a genuine JPEG signature", async () => {
  const file = fakeFile(JPEG_SIGNATURE, "image/jpeg", "logo.jpg");
  const error = await validateLogoFile(file);
  assert.equal(error, null);
});

test("validateLogoFile rejects a WEBP-claimed file missing the WEBP four-byte marker", async () => {
  // RIFF header present (first 4 bytes) but not a real WEBP payload.
  const fakeRiff = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x00, 0x00, 0x00, 0x00];
  const file = fakeFile(fakeRiff, "image/webp", "logo.webp");
  const error = await validateLogoFile(file);
  assert.ok(error);
});

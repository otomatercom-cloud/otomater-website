import { describe, expect, it } from "vitest";
import { parseBlock, blankBlock, BLOCK_TYPES } from "@/features/cms/blocks";
import { safeHref } from "@/features/cms/safe";
import { leadInputSchema } from "@/features/cms/types";

describe("block schemas", () => {
  it("every block type has a valid blank default", () => {
    for (const t of BLOCK_TYPES) expect(parseBlock(blankBlock(t, "b_test0001"))).not.toBeNull();
  });
  it("rejects javascript: links and drops the invalid block", () => {
    const b = { ...blankBlock("cta", "b_test0002"), data: { heading: "x", body: "", buttons: [{ label: "go", href: "javascript:alert(1)" }] } };
    expect(parseBlock(b)).toBeNull();
  });
  it("rejects unknown block types and bad video ids", () => {
    expect(parseBlock({ key: "b_test0003", type: "script", data: {} })).toBeNull();
    expect(parseBlock({ ...blankBlock("video", "b_test0004"), data: { provider: "youtube", videoId: "<x>" } })).toBeNull();
  });
  it("safeHref allows only safe schemes", () => {
    for (const ok of ["/about", "#top", "https://a.b", "mailto:a@b.c", "tel:+911234567"]) expect(safeHref(ok)).toBe(true);
    for (const bad of ["javascript:x", "data:text/html,x", "//evil.com", "vbscript:x"]) expect(safeHref(bad)).toBe(false);
  });
  it("lead input needs consent and an empty honeypot", () => {
    const base = { fullName: "Asha K", email: "A@B.com", phone: "+91 98765 43210", consent: true, idempotencyKey: "abcdefghijklmnop1234" };
    expect(leadInputSchema.safeParse(base).success).toBe(true);
    expect(leadInputSchema.safeParse({ ...base, consent: false }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...base, website: "spam" }).success).toBe(false);
  });
});

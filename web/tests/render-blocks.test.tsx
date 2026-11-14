import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { BlockView } from "@/components/blocks/blocks";
import { blankBlock } from "@/features/cms/blocks";

const ctx = { site: { contact: {}, navigation: [], footer: {} } as never, pageSlug: "home" };
describe("server render of new blocks", () => {
  it("renders numbered accent cards and the automation block", () => {
    const cards = blankBlock("cards", "c1");
    Object.assign(cards.data, { numbered: true, items: [{ icon: "Users", title: "CRM", text: "t", href: "", tagline: "TAG", accent: "blue", points: ["a", "b"] }] });
    const auto = blankBlock("automation", "a1");
    Object.assign(auto.data, { prefix: "Automate Your", words: ["CRM", "ERP"], nodes: [{ label: "CRM", value: "", caption: "customers", accent: "green" }], hubLabel: "360°" });
    const demo = blankBlock("automation_demo", "d1");
    Object.assign(demo.data, { heading: "Try", steps: [{ label: "Enquiry captured", caption: "c" }, { label: "WhatsApp", caption: "c" }] });
    const dctx = { site: { settings: { leads: { consentText: "I agree", privacyHref: "" } } } as never, pageSlug: "home" };
    expect(renderToString(createElement(BlockView, { block: demo, ctx: dctx }))).toContain("Sample");
    for (const b of [cards, auto]) {
      const html = renderToString(createElement(BlockView, { block: b, ctx }));
      expect(html.length).toBeGreaterThan(200);
    }
    expect(renderToString(createElement(BlockView, { block: cards, ctx }))).toContain("01");
  });
});

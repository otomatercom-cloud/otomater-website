import { describe, expect, it } from "vitest";
import { parseRichText } from "@/features/cms/richtext";

const flat = (s: string) => JSON.stringify(parseRichText(s));
describe("rich text", () => {
  it("renders headings, lists, bold and safe links", () => {
    const n = parseRichText("## Title\n\n- a\n- **b**\n\nSee [us](/contact) and *this*.");
    expect(n.map((x) => x.t)).toEqual(["h2", "ul", "p"]);
    expect(flat("[x](https://a.b)")).toContain('"t":"a"');
  });
  it("never turns unsafe links or HTML into markup", () => {
    expect(flat("[x](javascript:alert(1))")).not.toContain('"t":"a"');
    expect(flat("[x](data:text/html,hi)")).not.toContain('"t":"a"');
    expect(flat("<script>alert(1)</script>")).toContain("<script>"); // kept as inert text, React escapes it
  });
});

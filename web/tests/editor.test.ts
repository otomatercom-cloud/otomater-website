import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, parseBlock } from "../src/features/cms/blocks";
import { BLOCK_FIELDS, SETTING_FIELDS, starterBlock } from "../src/features/cms/editor-fields";
import { SETTING_GROUPS, settingSchemas } from "../src/features/cms/settings";

describe("editor schema", () => {
  it("every starter block is valid and has an editor form", () => {
    for (const t of BLOCK_TYPES) {
      expect(parseBlock(starterBlock(t, "b_test0001")), t).not.toBeNull();
      expect(BLOCK_FIELDS[t].length, t).toBeGreaterThan(0);
    }
  });
  it("every settings group has fields and parses from empty", () => {
    for (const g of SETTING_GROUPS) {
      expect(SETTING_FIELDS[g].length, g).toBeGreaterThan(0);
      expect(settingSchemas[g].safeParse({}).success, g).toBe(true);
    }
  });
  it("field names exist in the block schema", () => {
    for (const t of BLOCK_TYPES) {
      const data = starterBlock(t, "b_test0001").data as Record<string, unknown>;
      for (const f of BLOCK_FIELDS[t]) expect(f.name in data, `${t}.${f.name}`).toBe(true);
    }
  });
});

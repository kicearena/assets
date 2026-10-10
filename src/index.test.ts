import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { ASSETS, ASSET_VERSION, assetUrl, type AssetId } from "./index.js";
import { assetFilePath } from "./node.js";
describe("versioned assets", () => {
  it("preserves every inventoried asset and fully decodes its original bytes", async () => {
    expect(Object.keys(ASSETS)).toHaveLength(49);
    for (const id of Object.keys(ASSETS) as AssetId[]) {
      const bytes = readFileSync(assetFilePath(id));
      expect(bytes.length).toBe(ASSETS[id].bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        ASSETS[id].sha256,
      );
      const raw = await sharp(bytes).raw().toBuffer();
      expect(raw.length).toBeGreaterThan(0);
    }
  });
  it("uses identical immutable paths locally and at a CDN origin", () => {
    const local = assetUrl("ranks/rank-ss");
    expect(local).toBe(`/kice-assets/${ASSET_VERSION}/ranks/rank-ss.svg`);
    expect(assetUrl("ranks/rank-ss", "https://cdn.example.com/")).toBe(
      `https://cdn.example.com${local}`,
    );
  });
  it.each([
    "file:///tmp",
    "javascript:alert(1)",
    "https://cdn.example.com/prefix",
    "https://cdn.example.com?token=secret",
    "https://user:pass@cdn.example.com",
  ])("rejects non-origin CDN base %s", (base) => {
    expect(() => assetUrl("icons/main", base)).toThrow();
  });
  it("rejects missing assets rather than selecting a fallback", () => {
    expect(() => assetFilePath("missing" as AssetId)).toThrow("Unknown asset");
  });
});

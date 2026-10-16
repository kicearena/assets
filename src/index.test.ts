import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { ASSETS, ASSET_VERSION, assetUrl, type AssetId } from "./index.js";
import { assetFilePath } from "./node.js";
describe("versioned assets", () => {
  it("preserves every inventoried asset and fully decodes its original bytes", async () => {
    expect(Object.keys(ASSETS)).toHaveLength(274);
    for (const id of Object.keys(ASSETS) as AssetId[]) {
      const bytes = readFileSync(assetFilePath(id));
      expect(bytes.length).toBe(ASSETS[id].bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        ASSETS[id].sha256,
      );
      if (ASSETS[id].mediaType.startsWith("image/")) {
        const raw = await sharp(bytes).raw().toBuffer();
        expect(raw.length).toBeGreaterThan(0);
      }
    }
  });
  it("ships borderless default icons and an articulated portable animation catalog", async () => {
    for (const name of [
      "01-polynomial",
      "02-equations-inequalities",
      "03-functions",
      "04-exponents-logarithms",
      "05-trigonometry",
      "06-sequences",
      "07-limits",
      "08-derivatives",
      "09-integrals",
      "10-counting",
      "11-probability",
      "12-statistics",
      "13-sets-propositions",
      "14-coordinate-geometry",
      "15-circles",
      "16-conic-sections",
      "17-vectors",
      "18-solid-geometry",
    ]) {
      const full = await sharp(
        assetFilePath(`icons/topics/${name}` as AssetId),
      ).metadata();
      expect([full.width, full.height]).toEqual([512, 512]);
    }
    expect(assetFilePath("animation/catalog" as AssetId)).toContain(
      "assets/animation/catalog.json",
    );
    const animationCatalog = JSON.parse(
      readFileSync(assetFilePath("animation/catalog" as AssetId), "utf8"),
    );
    expect(animationCatalog.format).toBe("kice-cutout-kit");
    expect(animationCatalog.tags).toHaveLength(18);
    expect(Object.keys(animationCatalog.scenes)).toHaveLength(18);
    expect(assetFilePath("animation/runtime/kit" as AssetId)).toContain(
      "assets/animation/runtime/kit.js",
    );
    expect(assetFilePath("animation/examples/index" as AssetId)).toContain(
      "assets/animation/examples/index.html",
    );
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

describe("mascot artwork and animation", () => {
  it("includes the single borderless default topic set", async () => {
    const topics = [
      "01-polynomial",
      "02-equations-inequalities",
      "03-functions",
      "04-exponents-logarithms",
      "05-trigonometry",
      "06-sequences",
      "07-limits",
      "08-derivatives",
      "09-integrals",
      "10-counting",
      "11-probability",
      "12-statistics",
      "13-sets-propositions",
      "14-coordinate-geometry",
      "15-circles",
      "16-conic-sections",
      "17-vectors",
      "18-solid-geometry",
    ];
    for (const topic of topics) {
      const metadata = await sharp(
        assetFilePath(`icons/topics/${topic}` as AssetId),
      ).metadata();
      expect([metadata.width, metadata.height]).toEqual([512, 512]);
    }
  });

  it("exposes every portable device scene and the standalone Canvas runtime", () => {
    const catalog = JSON.parse(
      readFileSync(assetFilePath("animation/catalog" as AssetId), "utf8"),
    );
    expect(catalog.tags).toHaveLength(18);
    expect(Object.keys(catalog.scenes)).toHaveLength(18);
    expect(assetFilePath("animation/runtime/kit" as AssetId)).toMatch(
      /assets\/animation\/runtime\/kit\.js$/,
    );
    expect(assetFilePath("animation/examples/index" as AssetId)).toMatch(
      /assets\/animation\/examples\/index\.html$/,
    );
    const character = JSON.parse(
      readFileSync(assetFilePath("animation/character" as AssetId), "utf8"),
    );
    expect(Object.keys(character.motions)).toHaveLength(22);
    expect(character.model.proportions.upperArmLength).toBe(32);
    expect(character.model.proportions.forearmLength).toBe(32);
  });
});

import { describe, expect, it } from "vitest";
import { animationBaseUrl, sampleKeys } from "./animation.js";
import { assetFilePath } from "./node.js";
import type { AssetId } from "./index.js";

describe("mascot animation package", () => {
  it("provides a versioned local and CDN directory for the standalone runtime", () => {
    expect(animationBaseUrl()).toBe("/kice-assets/0.2.0/animation/");
    expect(animationBaseUrl("https://cdn.example.com")).toBe(
      "https://cdn.example.com/kice-assets/0.2.0/animation/",
    );
    expect(assetFilePath("animation/runtime/kit" as AssetId)).toMatch(
      /assets\/animation\/runtime\/kit\.js$/,
    );
  });

  it("samples apparatus tracks with eased, stable end values", () => {
    const keys: Array<[number, number]> = [
      [0, 0],
      [0.5, 1],
      [1, 0],
    ];
    expect(sampleKeys(keys, 0)).toBe(0);
    expect(sampleKeys(keys, 1)).toBe(0);
    expect(sampleKeys(keys, 0.25)).toBeCloseTo(0.5, 7);
    expect(sampleKeys([], 0.5, 7)).toBe(7);
  });
});

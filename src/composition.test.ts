import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createPlayer, type Scene } from "./animation.js";
const catalog = JSON.parse(
  readFileSync("assets/animation/catalog.json", "utf8"),
);
const character = JSON.parse(
  readFileSync("assets/animation/character.json", "utf8"),
);
afterEach(() => vi.unstubAllGlobals());
function browser() {
  const draws: string[] = [];
  const ctx = new Proxy(
    { globalAlpha: 1 },
    {
      get(target, key) {
        if (key in target) return target[key as keyof typeof target];
        if (key === "drawImage")
          return (image: { src: string }) => draws.push(String(image.src));
        return () => {};
      },
    },
  );
  vi.stubGlobal("document", { baseURI: "https://example.com/" });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("devicePixelRatio", 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal(
    "Image",
    class {
      src = "";
      crossOrigin = "";
      async decode() {}
    },
  );
  vi.stubGlobal("fetch", async (url: URL) => ({
    ok: true,
    json: async () =>
      url.pathname.endsWith("catalog.json") ? catalog : character,
  }));
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { canvas, draws };
}
const scene: Scene = {
  id: "custom",
  label: "custom",
  size: [960, 540],
  duration: 6,
  loop: false,
  nodes: [
    {
      id: "hero",
      character: "mascot",
      action: "hold_pointer",
      position: [230, 350],
      showMotionTool: false,
      timeScale: 0.8,
      timeOffset: 0.2,
    },
    {
      id: "tool",
      asset: "tool-book",
      parent: "hero",
      socket: "right_hand",
      followRotation: true,
      z: 2,
    },
    { id: "device", asset: "unit-circle", position: [480, 300] },
    {
      id: "spark",
      asset: "proud-stars",
      parent: "device",
      start: 2,
      duration: 1,
      z: 3,
    },
  ],
};
describe("independent animation composition", () => {
  it("replaces the clip tool, selects PNGs and renders repeatable video frames including the end", async () => {
    const { canvas, draws } = browser();
    const player = await createPlayer(canvas, {
      baseURL: "/animation/",
      scene,
      pixelRatio: 4,
      imageFormat: "png",
      reducedMotion: false,
    });
    expect([canvas.width, canvas.height]).toEqual([3840, 2160]);
    draws.length = 0;
    player.render(2.4);
    const first = [...draws];
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((url) => url.includes(".png?"))).toBe(true);
    expect(first.some((url) => url.includes("tool-book"))).toBe(true);
    expect(first.some((url) => url.includes("tool-pointer"))).toBe(false);
    player.render(4);
    draws.length = 0;
    player.render(2.4);
    expect(draws).toEqual(first);
    draws.length = 0;
    player.render(6);
    expect(draws.length).toBeGreaterThan(0);
    player.dispose();
  });
  it("plays devices without a mascot and validates timing", async () => {
    const { canvas, draws } = browser();
    const player = await createPlayer(canvas, {
      baseURL: "/animation/",
      scene: {
        ...scene,
        nodes: scene.nodes.filter((n) => n.id === "device" || n.id === "spark"),
      },
    });
    player.render(2.4);
    expect(draws.length).toBeGreaterThan(0);
    await expect(
      player.setScene({
        ...scene,
        nodes: [{ ...scene.nodes[0], timeScale: -1 }],
      }),
    ).rejects.toThrow("Invalid timing");
    player.dispose();
  });
  it("keeps the authored prop by default and respects reduced motion", async () => {
    const { canvas, draws } = browser();
    const player = await createPlayer(canvas, {
      baseURL: "/animation/",
      scene: {
        ...scene,
        posterTime: 2.4,
        nodes: [{ ...scene.nodes[0], showMotionTool: true }],
      },
      reducedMotion: true,
    });
    expect(draws.some((url) => url.includes("tool-pointer"))).toBe(true);
    player.play();
    expect(player.playing).toBe(false);
    player.dispose();
  });
});

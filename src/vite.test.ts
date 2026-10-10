import { describe, expect, it } from "vitest";
import { build, createServer } from "vite";
import { mkdtemp, readFile, writeFile, rm, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { kiceAssets } from "./vite.js";
import { assetUrl, ASSETS, type AssetId } from "./index.js";
import { assetFilePath } from "./node.js";
describe("Vite asset boundary", () => {
  it("serves listed bytes and rejects missing or traversed paths", async () => {
    const server = await createServer({
      configFile: false,
      plugins: [kiceAssets()],
      server: { port: 0, host: "127.0.0.1" },
      logLevel: "silent",
    });
    await server.listen();
    try {
      const origin = server.resolvedUrls!.local[0].replace(/\/$/, "");
      const path = assetUrl("icons/main");
      const response = await fetch(origin + path);
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(Buffer.from(await response.arrayBuffer())).toEqual(
        await readFile(assetFilePath("icons/main")),
      );
      expect(
        (await fetch(origin + path, { method: "HEAD" })).headers.get(
          "content-length",
        ),
      ).toBe(String(ASSETS["icons/main"].bytes));
      expect((await fetch(origin + "/kice-assets/0.1.0/missing")).status).toBe(
        404,
      );
      expect(
        (await fetch(origin + "/kice-assets/0.1.0/%2e%2e/package.json")).status,
      ).toBe(404);
    } finally {
      await server.close();
    }
  });
  it("emits the complete catalog and original files in a standalone build", async () => {
    const root = await realpath(
      await mkdtemp(join(tmpdir(), "kice-assets-vite-")),
    );
    try {
      await writeFile(
        join(root, "index.html"),
        '<html><head><link rel="icon" href="__KICE_MAIN_ICON__" /></head><body>Assets</body></html>',
      );
      await build({
        configFile: false,
        root,
        plugins: [kiceAssets()],
        logLevel: "silent",
      });
      expect(await readFile(join(root, "dist/index.html"), "utf8")).toContain(
        assetUrl("icons/main"),
      );
      for (const id of Object.keys(ASSETS) as AssetId[])
        expect(
          (await readFile(join(root, "dist", assetUrl(id).slice(1)))).equals(
            await readFile(assetFilePath(id)),
          ),
        ).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

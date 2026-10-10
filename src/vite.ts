import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { ASSETS, ASSET_BASE_PATH, type AssetId } from "./catalog.js";
import { assetUrl, PAGE_ICON_URLS } from "./index.js";
import { assetFilePath } from "./node.js";
/** Emit the package bytes at the same versioned URL in dev and build. */
export function kiceAssets(): Plugin {
  const ids = Object.keys(ASSETS) as AssetId[];
  const byUrl = new Map(ids.map((id) => [assetUrl(id), id]));
  return {
    name: "vite-plugin-kice-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (!pathname.startsWith(`${ASSET_BASE_PATH}/`)) return next();
        const id = byUrl.get(pathname);
        if (!id) {
          res.statusCode = 404;
          res.end();
          return;
        }
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.statusCode = 405;
          res.setHeader("Allow", "GET, HEAD");
          res.end();
          return;
        }
        const asset = ASSETS[id];
        res.setHeader("Content-Type", asset.mediaType);
        res.setHeader("Content-Length", asset.bytes);
        res.setHeader("Cache-Control", "no-cache");
        res.end(
          req.method === "HEAD" ? undefined : readFileSync(assetFilePath(id)),
        );
      });
    },
    transformIndexHtml: {
      order: "pre",
      handler: (html) =>
        html.replaceAll("__KICE_MAIN_ICON__", PAGE_ICON_URLS.main),
    },
    generateBundle() {
      for (const id of ids)
        this.emitFile({
          type: "asset",
          fileName: assetUrl(id).slice(1),
          source: readFileSync(assetFilePath(id)),
        });
      this.emitFile({
        type: "asset",
        fileName: `${ASSET_BASE_PATH.slice(1)}/catalog.json`,
        source: JSON.stringify({
          version: ASSET_BASE_PATH.split("/").at(-1),
          assets: ASSETS,
        }),
      });
    },
  };
}

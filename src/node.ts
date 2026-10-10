import { fileURLToPath } from "node:url";
import { ASSETS, type AssetId } from "./catalog.js";
export const assetDirectory = fileURLToPath(
  new URL("../assets/", import.meta.url),
);
export function assetFilePath(id: AssetId) {
  const asset = ASSETS[id];
  if (!asset) throw new RangeError(`Unknown asset: ${id}`);
  return fileURLToPath(new URL(`../assets/${asset.path}`, import.meta.url));
}

export {
  ASSETS,
  ASSET_VERSION,
  ASSET_BASE_PATH,
  type AssetId,
} from "./catalog.js";
import { ASSETS, ASSET_BASE_PATH, type AssetId } from "./catalog.js";
/** CDN origin is optional; the versioned path stays identical. */
export function assetUrl(id: AssetId, cdnOrigin = "") {
  const asset = ASSETS[id];
  if (!asset) throw new RangeError(`Unknown asset: ${id}`);
  let origin = "";
  if (cdnOrigin) {
    const url = new URL(cdnOrigin);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      throw new TypeError("CDN base must be an HTTP(S) origin");
    origin = url.origin;
  }
  return `${origin}${ASSET_BASE_PATH}/${asset.path}`;
}
export const PAGE_ICON_URLS = {
  main: assetUrl("icons/main"),
  heroMotion: assetUrl("icons/hero-motion"),
  notFound: assetUrl("icons/not-found"),
  practice: assetUrl("icons/practice-together"),
  problems: assetUrl("icons/problems"),
} as const;
export const RANK_ICON_URLS = {
  unranked: assetUrl("ranks/rank-unranked"),
  x: assetUrl("ranks/rank-x"),
  ss: assetUrl("ranks/rank-ss"),
  s: assetUrl("ranks/rank-s"),
  a: assetUrl("ranks/rank-a"),
  b: assetUrl("ranks/rank-b"),
  c: assetUrl("ranks/rank-c"),
} as const;

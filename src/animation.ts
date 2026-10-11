export {
  assetSocket,
  characterFrame,
  createPlayer,
  loadKit,
  multiply,
  poseAt,
  sampleKeys,
} from "../assets/animation/runtime/kit.js";
export type {
  Asset,
  Catalog,
  Character,
  Keys,
  Matrix,
  Motion,
  Player,
  PoseState,
  Scene,
  SceneNode,
  Tracks,
  Vec2,
} from "../assets/animation/runtime/kit.js";

import { assetUrl } from "./index.js";

/** Base URL for this release's portable animation catalog and artwork. */
export function animationBaseUrl(cdnOrigin = ""): string {
  return assetUrl("animation/catalog", cdnOrigin).replace(/catalog\.json$/, "");
}

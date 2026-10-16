# @kicearena/assets

KICE Arena's versioned rank and product artwork, borderless topic icons, and portable mascot animation kit.

[MIT](LICENSE) · ESM + TypeScript · Browser / Node / Vite · [![npm version](https://img.shields.io/npm/v/%40kicearena%2Fassets)](https://www.npmjs.com/package/@kicearena/assets)

![KICE mascot animation and math apparatus](docs/images/preview.png)

## Use

Version 0.2.1 is prepared here; registry publication is a separate release step. Until published, run `bun run build && npm pack` and install the resulting tarball. After publication:

```sh
npm install --save-exact @kicearena/assets@0.2.1
# or
bun add --exact @kicearena/assets@0.2.1
```

```ts
import { assetUrl, PAGE_ICON_URLS, RANK_ICON_URLS } from "@kicearena/assets";
const badge = RANK_ICON_URLS.ss;
const logo = PAGE_ICON_URLS.main;
const cdn = assetUrl("ranks/rank-ss", "https://cdn.example.com");
```

Vite consumers add `kiceAssets()` from `@kicearena/assets/vite` to their plugins. It serves assets during development and emits original bytes into `dist/kice-assets/0.2.1/`. Use `__KICE_MAIN_ICON__` in HTML templates to resolve the same catalog logo. Other build systems can copy `assetDirectory` from `@kicearena/assets/node` to that versioned static path. `assetFilePath(id)` resolves installed files without depending on the application checkout.

## CDN contract

Upload the emitted `kice-assets/0.2.1` directory unchanged. The optional CDN origin changes the host only; URLs retain the version and relative filename. Serve immutable versions with `Cache-Control: public, max-age=31536000, immutable`. Never overwrite a published version. [catalog.json](catalog.json) includes size, SHA-256 and media type for every original and new asset. A cross-origin CDN must allow CORS for JSON, images and canvas export; a CDN rollout is separate from installing this package.

## Revised topic icons and mascot animation

The 0.2.1 catalog makes the approved 512×512 borderless artwork the default for all 18 `icons/topics/` IDs. The duplicate `icons/topics/compact/` paths are removed. Previously published versions retain their immutable bytes. The catalog records each file's size and SHA-256.

The portable mascot kit has one shared 22-motion character, 18 articulated math devices, 12 expression/effect assets, and eight hand props. Its SVG and PNG parts include pivots and moving attachment sockets. JSON scenes combine the character, apparatus, and effects.

```ts
import { animationBaseUrl, createPlayer } from "@kicearena/assets/animation";

const player = await createPlayer(canvas, {
  baseURL: animationBaseUrl(),
  scene: "unit-circle",
});
player.play();
await player.emit("proud-stars", {
  parent: "apparatus",
  socket: "handle",
  position: [0, 0],
});
// Dispose the player when its view is removed.
player.dispose();
```

The Canvas 2D runtime has no framework or game-engine dependency. The catalog Vite plugin serves and emits it under `/kice-assets/0.2.1/`. See [animation format](assets/animation/FORMAT.md), [interactive device gallery](assets/animation/examples/index.html), and [motion credits](assets/animation/CREDITS.md).

## Gallery and development

```sh
bun install --frozen-lockfile
bun run demo
bun run check
bun run test
bun run build
bun run demo:build
```

After adding or updating files under `assets/`, run `bun run catalog:update` to regenerate the SHA-256 catalog and its TypeScript table. The gallery uses the real catalog, shows both topic-icon resolutions, and links to the animation scenes. Tests decode every inventoried file and check the recorded hashes, CDN paths, dev serving, HEAD, missing paths and the standalone build. [Original artwork provenance](provenance/kice-assets.json) and [mascot/animation provenance](provenance/mascot-animation-0.2.1.json) record their sources and attribution. Rating thresholds, rank selection, profile choices and topic taxonomy belong to the consuming application.

## License

[MIT](LICENSE) © 2026 KICE Arena contributors. Third-party provider symbols and fonts are not part of this package; they retain their own ownership and licenses in the application. The KICE name and marks do not imply endorsement.

See [composition and web/video integration](docs/composition.md) for independent tools, effects and deterministic video frames.

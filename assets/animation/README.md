# KICE mascot animation assets

This directory is the portable art-and-scene bundle shipped by `@kicearena/assets@0.2.0`. It contains the common mascot, 22 motion clips, 18 articulated math apparatus, 12 character effects and eight hand props. Device parts have independent pivots and moving sockets. Scene graphs define how the same mascot, one device and optional effects enter, operate and leave.

## Install the package

```sh
npm install --save-exact @kicearena/assets@0.2.0
```

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
// Dispose the animation when its view is removed.
player.dispose();
```

`animationBaseUrl()` points at the catalog in this package release. Add `kiceAssets()` from `@kicearena/assets/vite` to Vite so the same files are served in development and emitted in builds. The optional origin parameter can direct URLs at your CDN. Scene and runtime data remain versioned alongside the icons.

## Standalone files

For a lightweight app, copy this `animation/` directory into its static asset location, import `runtime/kit.js`, and pass the copied directory URL with a trailing slash as `baseURL`. This keeps the player independent of the KICE application checkout. The `examples/index.html` page is the live editor and `examples/minimal.html` shows the few calls needed to mount a scene. Serve these files over HTTP instead of opening the HTML with `file://`.

The runtime is an ES module using browser Canvas 2D, fetch, SVG image decoding and requestAnimationFrame. It has no framework or game-engine dependency. `runtime/kit.d.ts` declares the API. `FORMAT.md` describes the coordinate, pivot, socket, keyframe and scene formats. `catalog.json` maps every item to the versioned package catalog.

`../icons/topics/mascot-v2/` contains 4096×4096 transparent exports; `../icons/topics/compact/mascot-v2/` contains 1024×1024 derivatives. `device-catalog.png` and `effect-catalog.png` show the original silhouettes. `CREDITS.md` records CMU motion-data attribution and use terms.

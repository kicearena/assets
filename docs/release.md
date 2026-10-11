# Immutable package releases

Run checks, tests and builds from the committed lockfile. Tag the verified commit with `v<package-version>`. The GitHub Actions workflow verifies the tag, repeats the build, packs once, then publishes the **same tarball and integrity** to GitHub Packages and npm. npm publishing uses GitHub OIDC; GitHub Packages publishing uses the workflow's package write permission.

The first npm release bootstraps the package from a maintainer CLI session after `npm login --auth-type=web`, with `GH_PACKAGES_TOKEN` set for the GitHub mirror. After that release creates the npm package, configure this repository's `package.yml` workflow as its trusted GitHub Actions publisher in npm. Subsequent releases use OIDC and need no long-lived npm token.

A rerun accepts an already published version only if its tarball integrity is identical; different bytes require a new version. README is included in the package, so consumer documentation changes receive a patch release. Consumers may install from npm without configuring a registry; KICE continues to use GitHub Packages for the shared private/public scope.

## 0.2.0 mascot artwork and animation

Version `0.2.0` adds a 4K and compact revision of the 18 topic icons plus an independent cutout animation kit with the shared mascot, 18 articulated math devices, 12 new expression/effect assets, and eight hand tools. The bundled Canvas 2D runtime and scene catalog are addressable under the immutable `/kice-assets/0.2.0/animation/` prefix. Earlier `0.1.0` URLs remain available as their existing immutable version.

Run `bun run check && bun run test && bun run build && bun run demo:build` and smoke-test `dist/kice-assets/0.2.0/animation/examples/index.html` before release. The interactive motion gallery lives at `assets/animation/examples/index.html`; a consumer does not need the repository checkout to use the published package.

import { ASSETS, assetUrl, type AssetId } from "../src/index.js";
import "./style.css";
for (const [selector, prefix] of [
  ["#ranks", "ranks/"],
  ["#pages", "icons/"],
  ["#topics", "icons/topics/"],
  ["#topic-masters", "icons/topics/"],
]) {
  const ids = (Object.keys(ASSETS) as AssetId[]).filter(
    (id) =>
      id.startsWith(prefix) &&
      (selector !== "#pages" || !id.startsWith("icons/topics/")),
  );
  for (const id of ids) {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = assetUrl(id);
    image.alt = id;
    image.loading = "lazy";
    image.decoding = "async";
    const caption = document.createElement("figcaption");
    caption.textContent = id.split("/").at(-1)!;
    figure.append(image, caption);
    document.querySelector(selector)!.append(figure);
  }
}

const animationLink =
  document.querySelector<HTMLAnchorElement>("#animation-demo");
if (!animationLink) throw new Error("Mascot animation gallery link is missing");
animationLink.href = assetUrl("animation/examples/index.html");

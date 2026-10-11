/* global document, Option, matchMedia */
import { createPlayer } from "../runtime/kit.js";
const $ = (id) => document.getElementById(id),
  baseURL = new URL("../", document.baseURI).href;
let player,
  chosen,
  updating = false;
const showError = (error) => {
  $("error").textContent = error.message;
  $("reduced").disabled = false;
  console.error(error);
};
function info() {
  const scene = player.scene,
    asset = player.catalog.assets[scene.id];
  $("title").textContent = scene.label;
  $("svg").href = new URL(asset.files.svg, baseURL);
  $("png").href = new URL(asset.files.png, baseURL);
}
async function setup() {
  $("error").textContent = "";
  $("reduced").disabled = true;
  const reduced = $("reduced").checked;
  player?.dispose();
  player = await createPlayer($("stage"), {
    baseURL,
    scene: chosen,
    reducedMotion: reduced,
    onFrame: ({ time, duration }) => {
      if (!updating) {
        $("time").max = duration;
        $("time").value = time;
        $("clock").textContent = `${time.toFixed(1)}초`;
      }
    },
  });
  chosen = player.scene.id;
  if (!$("topic").options.length) {
    for (const tag of player.catalog.tags)
      $("topic").add(new Option(tag.label, tag.scene));
    for (const [id, a] of Object.entries(player.catalog.assets)) {
      if (!["effect", "expression"].includes(a.kind)) continue;
      const b = document.createElement("button");
      b.textContent = a.label;
      b.onclick = async () => {
        try {
          await player.emit(id);
          player.play();
          $("play").textContent = "일시정지";
        } catch (e) {
          showError(e);
        }
      };
      $("effects").append(b);
    }
  }
  $("topic").value = chosen;
  info();
  $("device-react").disabled = reduced;
  $("play").disabled = reduced;
  $("replay").disabled = reduced;
  $("poster").disabled = reduced;
  $("time").disabled = reduced;
  $("topic").disabled = false;
  $("reduced").disabled = false;
  for (const b of $("effects").children) b.disabled = reduced;
  if (!reduced) {
    player.play();
    $("play").textContent = "일시정지";
  } else $("play").textContent = "정지 화면";
}
$("reduced").checked = matchMedia("(prefers-reduced-motion: reduce)").matches;
$("device-react").onclick = async () => {
  try {
    const asset = player.catalog.assets[player.scene.id];
    const socket = asset.sockets.handle
      ? "handle"
      : asset.sockets.output
        ? "output"
        : Object.keys(asset.sockets)[0];
    await player.emit("proud-stars", {
      parent: "apparatus",
      socket,
      position: [0, 0],
      scale: 0.65,
    });
    player.play();
    $("play").textContent = "일시정지";
  } catch (e) {
    showError(e);
  }
};
$("topic").onchange = async () => {
  chosen = $("topic").value;
  $("topic").disabled = true;
  try {
    await player.setScene(chosen);
    info();
  } catch (e) {
    showError(e);
  } finally {
    $("topic").disabled = false;
    $("reduced").disabled = false;
  }
};
$("play").onclick = () => {
  if (player.playing) {
    player.pause();
    $("play").textContent = "재생";
  } else {
    player.play();
    $("play").textContent = "일시정지";
  }
};
$("replay").onclick = () => {
  player.render(0);
  player.play();
  $("play").textContent = "일시정지";
};
$("time").oninput = () => {
  updating = true;
  player.pause();
  player.render(Number($("time").value));
  $("clock").textContent = `${Number($("time").value).toFixed(1)}초`;
  $("play").textContent = "재생";
  updating = false;
};
$("reduced").onchange = () => setup().catch(showError);
window.addEventListener("pagehide", () => player?.dispose());
setup().catch(showError);

$("poster").onclick = () => {
  player.pause();
  player.render(player.scene.posterTime ?? 0);
  $("play").textContent = "재생";
};

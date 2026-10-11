/* global Image, document, matchMedia, devicePixelRatio, structuredClone, requestAnimationFrame, cancelAnimationFrame */
/** Data-driven cutout playback. Browser Canvas 2D, no engine or application imports. */
export function sampleKeys(keys, phase, initial = 0) {
  if (!keys?.length) return initial;
  if (phase <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t, b] = keys[i],
      [previous, a] = keys[i - 1];
    if (phase <= t) {
      const u = (phase - previous) / (t - previous);
      return a + (b - a) * u * u * (3 - 2 * u);
    }
  }
  return keys.at(-1)[1];
}
const I = () => [1, 0, 0, 1, 0, 0];
export function multiply(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}
function transform(x = 0, y = 0, angle = 0, sx = 1, sy = sx) {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return [c * sx, s * sx, -s * sy, c * sy, x, y];
}
function point(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
function blend(a, b, u) {
  return a + (b - a) * u;
}
export function poseAt(motion, time) {
  const t = motion.loop
    ? ((time % motion.duration) + motion.duration) % motion.duration
    : Math.max(0, Math.min(time, motion.duration));
  const frame = motion.loop
      ? t * motion.fps
      : Math.min(t * motion.fps, motion.poses.length - 1),
    i = Math.floor(frame),
    j = i + 1 < motion.poses.length ? i + 1 : motion.loop ? 0 : i;
  const u = frame - i,
    a = motion.poses[i],
    b = motion.poses[j],
    pose = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
    pose[key] = blend(a[key] ?? 0, b[key] ?? 0, u);
  return { pose, frame: i, next: j, fraction: u };
}
export function characterFrame(character, action, time) {
  const motion = character.motions[action];
  if (!motion) throw new Error(`Unknown motion: ${action}`);
  const state = poseAt(motion, time),
    p = state.pose,
    matrices = { root: transform(p.rootX ?? 0, p.rootY ?? 0) },
    ends = {};
  for (const [name, bone] of Object.entries(character.model.bones)) {
    if (name === "root") continue;
    const local = bone.localBind,
      length = Math.hypot(
        bone.end[0] - bone.start[0],
        bone.end[1] - bone.start[1],
      );
    matrices[name] = multiply(
      matrices[bone.parent],
      transform(
        ...local.start,
        ((local.angle + (p[name] ?? 0)) * Math.PI) / 180,
      ),
    );
    ends[name] = point(matrices[name], length, 0);
  }
  return { ...state, matrices, ends, motion };
}
function tracks(values, phase) {
  return {
    x: sampleKeys(values?.x, phase),
    y: sampleKeys(values?.y, phase),
    rotation: sampleKeys(values?.rotation, phase),
    scaleX: sampleKeys(values?.scaleX, phase, 1),
    scaleY: sampleKeys(values?.scaleY, phase, 1),
    opacity: sampleKeys(values?.opacity, phase, 1),
  };
}
function apply(ctx, m) {
  ctx.transform(...m);
}
function phase(time, duration, loop) {
  return loop
    ? (((time % duration) + duration) % duration) / duration
    : Math.max(0, Math.min(1, time / duration));
}
export function assetSocket(asset, name, age) {
  const socket = asset.sockets[name];
  if (!socket) throw new Error(`Unknown socket: ${name}`);
  let p = socket.position;
  if (socket.part) {
    const part = asset.parts.find((p) => p.id === socket.part);
    if (!part) throw new Error(`Unknown socket part: ${socket.part}`);
    const v = tracks(part.tracks, phase(age, asset.duration, asset.loop));
    const m = multiply(
      transform(
        part.pivot[0] + v.x,
        part.pivot[1] + v.y,
        v.rotation,
        v.scaleX,
        v.scaleY,
      ),
      transform(-part.pivot[0], -part.pivot[1]),
    );
    p = point(m, ...p);
  }
  return [p[0] - asset.pivot[0], p[1] - asset.pivot[1]];
}
async function json(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Cannot load ${url}: ${response.status}`);
  return response.json();
}
async function loadImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}
export async function loadKit(baseURL) {
  const base = new URL(baseURL, document.baseURI);
  if (!base.pathname.endsWith("/"))
    throw new Error("baseURL must be a directory URL ending with /");
  const catalog = await json(new URL("catalog.json", base));
  if (catalog.format !== "kice-cutout-kit" || catalog.version !== 1)
    throw new Error("Unsupported kit format");
  const characters = Object.fromEntries(
    await Promise.all(
      Object.entries(catalog.characters).map(async ([id, file]) => [
        id,
        await json(new URL(file, base)),
      ]),
    ),
  );
  return { base, catalog, characters };
}
/** No internal RAF when render(time) is used; applications can own their clock. */
export async function createPlayer(
  canvas,
  {
    baseURL,
    scene,
    reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
    pixelRatio = Math.min(devicePixelRatio || 1, 3),
    background = null,
    onFrame = () => {},
  } = {},
) {
  if (!baseURL) throw new Error("baseURL is required");
  const kit = await loadKit(baseURL),
    ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  const images = new Map(),
    pending = new Map();
  let current = null,
    time = 0,
    raf = 0,
    last = 0,
    playing = false,
    disposed = false,
    request = 0,
    transients = [],
    nextId = 0;
  const assetImage = (part) => part.files.svg ?? part.files.png;
  async function prepareAsset(id) {
    const a = kit.catalog.assets[id];
    if (!a) throw new Error(`Unknown asset: ${id}`);
    for (const part of a.parts.length ? a.parts : [a]) {
      const file = assetImage(part);
      if (!pending.has(file))
        pending.set(
          file,
          loadImage(
            new URL(`${file}?v=${kit.catalog.revision}`, kit.base),
          ).then((im) => {
            if (!disposed) images.set(file, im);
          }),
        );
      await pending.get(file);
    }
  }
  function validateScene(value) {
    if (!value?.duration || !Array.isArray(value.nodes))
      throw new Error("Scene needs duration and nodes");
    const ids = new Set();
    for (const n of value.nodes) {
      if (ids.has(n.id)) throw new Error(`Duplicate node: ${n.id}`);
      ids.add(n.id);
      if (Boolean(n.asset) === Boolean(n.character))
        throw new Error(`Node ${n.id} needs exactly one asset or character`);
    }
    for (const n of value.nodes) {
      if (n.parent && !ids.has(n.parent))
        throw new Error(`Unknown parent: ${n.parent}`);
      const chain = new Set([n.id]);
      let parent = n.parent;
      while (parent) {
        if (chain.has(parent)) throw new Error(`Parent cycle: ${n.id}`);
        chain.add(parent);
        parent = value.nodes.find((x) => x.id === parent).parent;
      }
      if (n.character && !kit.characters[n.character]?.motions[n.action])
        throw new Error(`Unknown character/action: ${n.character}/${n.action}`);
      if (n.asset && !kit.catalog.assets[n.asset])
        throw new Error(`Unknown asset: ${n.asset}`);
      if (n.socket) {
        const parentNode = value.nodes.find((x) => x.id === n.parent);
        if (!parentNode) throw new Error("Socket needs a parent");
        const sockets = parentNode.character
          ? kit.characters[parentNode.character].model.sockets
          : kit.catalog.assets[parentNode.asset].sockets;
        if (!(n.socket in sockets))
          throw new Error(`Unknown socket: ${n.parent}/${n.socket}`);
      }
    }
    return structuredClone(value);
  }
  async function setScene(value) {
    if (disposed) throw new Error("Player disposed");
    const ticket = ++request;
    const next = validateScene(
      typeof value === "string" ? kit.catalog.scenes[value] : value,
    );
    await Promise.all(
      next.nodes.map(async (n) => {
        if (n.asset) await prepareAsset(n.asset);
        else {
          const a =
            kit.characters[n.character].motions[n.action].toolAttachment;
          if (a) await prepareAsset(a.tool);
        }
      }),
    );
    if (disposed || ticket !== request) return;
    current = next;
    time = 0;
    transients = [];
    canvas.width = Math.round(next.size[0] * pixelRatio);
    canvas.height = Math.round(next.size[1] * pixelRatio);
    render(0);
  }
  function assetDraw(a, age) {
    const p = phase(age, a.duration, a.loop),
      v = tracks(a.tracks, p);
    ctx.save();
    ctx.globalAlpha *= v.opacity;
    apply(ctx, transform(v.x, v.y, v.rotation, v.scaleX, v.scaleY));
    ctx.translate(-a.pivot[0], -a.pivot[1]);
    for (const part of a.parts.length ? a.parts : [a]) {
      ctx.save();
      if (a.parts.length) {
        const v = tracks(part.tracks, p);
        ctx.globalAlpha *= v.opacity;
        ctx.translate(part.pivot[0] + v.x, part.pivot[1] + v.y);
        ctx.rotate(v.rotation);
        ctx.scale(v.scaleX, v.scaleY);
        ctx.translate(-part.pivot[0], -part.pivot[1]);
      }
      const image = images.get(assetImage(part));
      if (image) ctx.drawImage(image, 0, 0, ...part.size);
      ctx.restore();
    }
    ctx.restore();
  }
  function characterDraw(character, state) {
    const { model } = character,
      { matrices, ends } = state;
    ctx.save();
    ctx.translate(-model.anchor[0], -model.anchor[1]);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const part of model.drawParts) {
      ctx.fillStyle = ctx.strokeStyle = part.color;
      if (part.type === "circle") {
        ctx.beginPath();
        ctx.arc(...ends[part.bone], part.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = part.width;
        ctx.beginPath();
        const start = matrices[part.bones[0]];
        ctx.moveTo(start[4], start[5]);
        for (const bone of part.bones) ctx.lineTo(...ends[bone]);
        ctx.stroke();
      }
    }
    const attachment = state.motion.toolAttachment;
    if (attachment) {
      const bone = model.sockets[attachment.socket],
        m = matrices[bone],
        rotation = blend(
          attachment.rotationFrames[state.frame],
          attachment.rotationFrames[state.next],
          state.fraction,
        );
      ctx.save();
      ctx.translate(...ends[bone]);
      ctx.rotate(Math.atan2(m[1], m[0]) + rotation);
      assetDraw(kit.catalog.assets[attachment.tool], 0);
      ctx.restore();
    }
    ctx.restore();
  }
  function render(seconds = time) {
    if (disposed || !current) return;
    time = seconds;
    const t = reducedMotion
      ? (current.posterTime ?? 0)
      : current.loop
        ? ((seconds % current.duration) + current.duration) % current.duration
        : Math.max(0, Math.min(seconds, current.duration));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(pixelRatio, pixelRatio);
    const nodes = [...current.nodes, ...transients],
      cache = new Map();
    function resolve(node) {
      if (cache.has(node.id)) return cache.get(node.id);
      const localTime = node.transient
          ? seconds - node.start
          : t - (node.start ?? 0),
        duration = node.duration ?? current.duration;
      const active = localTime >= 0 && localTime < duration;
      const v = tracks(
        node.tracks,
        Math.max(0, Math.min(1, localTime / duration)),
      );
      let parent = I(),
        opacity = 1;
      if (node.parent) {
        const owner = nodes.find((n) => n.id === node.parent);
        const frame = resolve(owner);
        parent = frame.matrix;
        opacity = frame.opacity;
        if (node.socket) {
          if (owner.character) {
            const model = kit.characters[owner.character].model,
              bone = model.sockets[node.socket],
              end = frame.character.ends[bone],
              m = frame.character.matrices[bone];
            parent = multiply(
              parent,
              transform(
                end[0] - model.anchor[0],
                end[1] - model.anchor[1],
                node.followRotation ? Math.atan2(m[1], m[0]) : 0,
              ),
            );
          } else {
            const a = kit.catalog.assets[owner.asset],
              socket = assetSocket(a, node.socket, frame.localTime);
            parent = multiply(parent, transform(...socket));
          }
        }
      }
      const scale = node.scale ?? 1,
        position = node.position ?? [0, 0];
      const matrix = multiply(
        parent,
        transform(
          position[0] + v.x,
          position[1] + v.y,
          (node.rotation ?? 0) + v.rotation,
          scale * v.scaleX * (node.mirror ?? 1),
          scale * v.scaleY,
        ),
      );
      const value = {
        matrix,
        opacity: active ? opacity * v.opacity : 0,
        localTime,
        character: node.character
          ? characterFrame(
              kit.characters[node.character],
              node.action,
              Math.max(0, localTime),
            )
          : null,
      };
      cache.set(node.id, value);
      return value;
    }
    for (const node of [...nodes].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))) {
      const value = resolve(node);
      if (value.opacity <= 0) continue;
      ctx.save();
      apply(ctx, value.matrix);
      ctx.globalAlpha *= value.opacity;
      if (node.character)
        characterDraw(kit.characters[node.character], value.character);
      else assetDraw(kit.catalog.assets[node.asset], value.localTime);
      ctx.restore();
    }
    transients = transients.filter(
      (n) => seconds >= n.start && seconds - n.start < n.duration,
    );
    onFrame({ time: t, duration: current.duration });
  }
  function tick(now) {
    if (!playing || disposed) return;
    const delta = last ? (now - last) / 1000 : 0;
    last = now;
    render(time + Math.min(delta, 0.1));
    raf = requestAnimationFrame(tick);
  }
  function play() {
    if (disposed || playing || reducedMotion) return;
    playing = true;
    last = 0;
    raf = requestAnimationFrame(tick);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }
  async function emit(
    asset,
    { parent = "hero", socket = "head", position, scale = 1, duration } = {},
  ) {
    if (!current || disposed) throw new Error("No active scene");
    if (reducedMotion) return;
    const a = kit.catalog.assets[asset];
    if (!a || !["effect", "expression"].includes(a.kind))
      throw new Error(`Unknown effect: ${asset}`);
    const sceneRequest = request;
    await prepareAsset(asset);
    if (disposed || sceneRequest !== request) return;
    const node = {
      id: `emission-${++nextId}`,
      asset,
      parent,
      socket,
      position: position ?? a.suggestedAttachment.offset,
      scale,
      start: time,
      duration: duration ?? a.duration,
      z: 100,
      transient: true,
    };
    validateScene({ ...current, nodes: [...current.nodes, node] });
    transients.push(node);
    render(time);
  }
  function dispose() {
    pause();
    disposed = true;
    request++;
    images.clear();
    pending.clear();
    transients = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  await setScene(scene ?? kit.catalog.tags[0].scene);
  return {
    catalog: kit.catalog,
    render,
    play,
    pause,
    setScene,
    emit,
    dispose,
    get time() {
      return time;
    },
    get scene() {
      return structuredClone(current);
    },
    get playing() {
      return playing;
    },
  };
}

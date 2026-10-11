export type Vec2 = [number, number];
export type Keys = Array<[number, number]>;
export type Tracks = Partial<
  Record<"x" | "y" | "rotation" | "scaleX" | "scaleY" | "opacity", Keys>
>;
export interface SceneNode {
  id: string;
  asset?: string;
  character?: string;
  action?: string;
  parent?: string;
  socket?: string;
  followRotation?: boolean;
  position?: Vec2;
  scale?: number;
  rotation?: number;
  mirror?: 1 | -1;
  z?: number;
  start?: number;
  duration?: number;
  tracks?: Tracks;
  /** Clip speed and offset; node visibility/tracks stay in scene seconds. */
  timeScale?: number;
  timeOffset?: number;
  /** Disable the clip-authored hand prop when composing a separate tool node. */
  showMotionTool?: boolean;
}
export interface Scene {
  id: string;
  label: string;
  size: Vec2;
  duration: number;
  loop: boolean;
  posterTime?: number;
  nodes: SceneNode[];
}
export interface Asset {
  kind: "device" | "effect" | "expression" | "tool";
  label: string;
  size: Vec2;
  pivot: Vec2;
  files: { svg?: string; png: string };
  parts: Array<{
    id: string;
    files: { svg: string; png: string };
    size: Vec2;
    pivot: Vec2;
    tracks: Tracks;
  }>;
  sockets: Record<string, { position: Vec2; part?: string }>;
  duration: number;
  loop: boolean;
  tracks?: Tracks;
  suggestedAttachment?: { socket: string; offset: Vec2 };
}
export interface Catalog {
  format: "kice-cutout-kit";
  version: 1;
  revision: string;
  assets: Record<string, Asset>;
  characters: Record<string, string>;
  tags: Array<{ id: string; label: string; scene: string; asset: string }>;
  scenes: Record<string, Scene>;
}
export interface Player {
  readonly catalog: Catalog;
  readonly scene: Scene;
  readonly time: number;
  readonly playing: boolean;
  setScene(scene: string | Scene): Promise<void>;
  render(seconds: number): void;
  play(): void;
  pause(): void;
  emit(
    asset: string,
    options?: {
      parent?: string;
      socket?: string;
      position?: Vec2;
      scale?: number;
      duration?: number;
    },
  ): Promise<void>;
  dispose(): void;
}
export function createPlayer(
  canvas: HTMLCanvasElement,
  options: {
    baseURL: string | URL;
    scene?: string | Scene;
    reducedMotion?: boolean;
    pixelRatio?: number;
    background?: string | null;
    imageFormat?: "svg" | "png";
    onFrame?: (frame: { time: number; duration: number }) => void;
  },
): Promise<Player>;
export function sampleKeys(
  keys: Keys | undefined,
  phase: number,
  initial?: number,
): number;
export function assetSocket(asset: Asset, name: string, age: number): Vec2;
export type Matrix = [number, number, number, number, number, number];
export interface Motion {
  label: string;
  poses: Record<string, number>[];
  fps: number;
  duration: number;
  loop: boolean;
  toolAttachment?: { tool: string; socket: string; rotationFrames: number[] };
}
export interface Character {
  model: {
    anchor: Vec2;
    bones: Record<
      string,
      {
        parent: string | null;
        start: Vec2;
        end: Vec2;
        localBind: { start: Vec2; angle: number };
      }
    >;
    sockets: Record<string, string>;
    drawParts: Array<{
      type: string;
      color: string;
      bone?: string;
      bones?: string[];
      radius?: number;
      width?: number;
    }>;
  };
  motions: Record<string, Motion>;
}
export interface PoseState {
  pose: Record<string, number>;
  frame: number;
  next: number;
  fraction: number;
}
export function poseAt(motion: Motion, time: number): PoseState;
export function characterFrame(
  character: Character,
  action: string,
  time: number,
): PoseState & {
  matrices: Record<string, Matrix>;
  ends: Record<string, Vec2>;
  motion: Motion;
};
export function multiply(a: Matrix, b: Matrix): Matrix;
export function loadKit(baseURL: string | URL): Promise<{
  base: URL;
  catalog: Catalog;
  characters: Record<string, Character>;
}>;

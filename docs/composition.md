# 캐릭터·도구·장치·이펙트 조합

한 캐릭터의 비율과 리그를 공유합니다. 태그 장면은 시작 예제이며 특정 도구나 이펙트를 강제하지 않습니다. `player.catalog.assets`, `characters`, `scenes`에서 사용 가능한 ID를 확인합니다. [실행 가능한 조합 예제](../assets/animation/examples/composition.html)는 캐릭터 없는 장치, 도구 교체, 16:9 영상 프레임을 함께 보여줍니다.

## 요소 제어

| 목적                    | 설정                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| 캐릭터 동작 선택        | `character: "mascot"`, `action: "present_book"`                                |
| 모션에 포함된 도구 제거 | 캐릭터 노드의 `showMotionTool: false`                                          |
| 별도 손 도구            | `asset: "tool-book"`, `parent`, `socket: "right_hand"`, `followRotation: true` |
| 캐릭터 없는 장치/이펙트 | `asset`과 `position`을 지정하고 `parent` 생략                                  |
| 얼굴·머리 반응          | `parent`와 `socket: "head"`; `position`으로 얼굴 위치 조정                     |
| 장치의 움직이는 부착점  | `parent`와 해당 장치의 `sockets` 이름                                          |
| 노출 시점·레이어        | `start`, `duration`, `z`                                                       |
| 등장·퇴장·이동          | `tracks`의 x/y/rotation/scaleX/scaleY/opacity                                  |
| 클립 속도·구간          | `timeScale` (0이면 고정), `timeOffset` (초). 노출/노드 트랙은 장면 시계를 유지 |

표정은 독립된 expression 노드입니다. 지속되는 얼굴 표정은 `timeScale: 0`과 `timeOffset: 0.4`로 표시 구간을 고정합니다.

손에 쥐는 도구는 잡는 위치가 다른 만큼 회전·위치 오프셋을 조정합니다. 기존 모션의 두 손 접촉을 다른 크기의 도구에 자동으로 재계산하지는 않습니다. 자연스러운 접촉이 필요한 경우 `present_book`, `use_compass`, `hold_pointer` 등 해당 도구의 작성된 모션을 우선 사용하세요. 자유로운 조합은 소켓과 트랙을 통해 제공하며 물리 시뮬레이션이나 자동 IK 편집기는 포함하지 않습니다.

```ts
import {
  animationBaseUrl,
  createPlayer,
  type Scene,
} from "@kicearena/assets/animation";
const scene: Scene = {
  id: "homepage",
  label: "수학 공작소",
  size: [720, 480],
  duration: 6,
  loop: true,
  posterTime: 2.4,
  nodes: [
    {
      id: "hero",
      character: "mascot",
      action: "hold_pointer",
      position: [230, 350],
      showMotionTool: false,
      timeScale: 0.85,
    },
    {
      id: "pointer",
      asset: "tool-pointer",
      parent: "hero",
      socket: "right_hand",
      followRotation: true,
      rotation: 0.2,
      z: 2,
    },
    {
      id: "face",
      asset: "joy-eyes",
      parent: "hero",
      socket: "head",
      timeScale: 0,
      timeOffset: 0.4,
      z: 3,
    },
    { id: "device", asset: "unit-circle", position: [480, 300], z: 1 },
    {
      id: "stars",
      asset: "proud-stars",
      parent: "device",
      start: 2,
      duration: 1,
      position: [0, -100],
      scale: 0.65,
      z: 3,
    },
  ],
};
const player = await createPlayer(canvas, {
  baseURL: animationBaseUrl(),
  scene,
});
player.play();
// 화면 해제 시 player.dispose()
```

## 홈페이지

- Vite의 `kiceAssets()` 플러그인 또는 정적 파일 복사로 URL을 실제 제공해야 합니다. npm 설치 자체는 CDN 배포가 아닙니다.
- SVG 기본 재생으로 확대 시 선을 유지합니다. Canvas는 투명하며 CSS `width: 100%; height: auto`로 비율을 유지합니다.
- `aria-label`로 의미를 제공하고, 재생 버튼·정지 버튼을 제공합니다. 장식이면 `aria-hidden="true"`를 사용합니다. 핵심 텍스트/CTA는 DOM에 둡니다.
- 기본값은 사용자의 reduced-motion 설정을 따르고 `posterTime`에 멈춥니다. 페이지가 숨겨지거나 화면 밖이면 `pause()`, 돌아오면 `play()`합니다. 언마운트 시 `dispose()`합니다.
- 장면 로드가 끝나면 선택된 파일만 이미지 캐시에 보관합니다. 장치 전체를 첫 화면에 동시에 배치하지 마세요. 비율·짧은 팔·둥근 끝점과 기존 색상을 유지하도록 균일 `scale`을 권장합니다.
- 다른 origin의 CDN은 JSON과 이미지에 CORS 응답을 제공해야 합니다. 이미지 로드는 anonymous CORS를 사용해 canvas export를 허용합니다.

## 영상 / 고해상도 렌더

장면 `size`는 논리 크기입니다. 16:9 `[960,540]`에 `pixelRatio: 2`를 주면 **1920×1080**, `4`면 **3840×2160**입니다. 세로 영상은 `[540,960]`을 사용하고 노드 위치를 재배치합니다. 글꼴에 따라 SVG 수학 기호가 다르게 보일 수 있으므로 고정된 제작 글꼴이 필요한 영상에는 `imageFormat: "png"`를 선택합니다. PNG 부품은 논리 크기의 8배입니다.

```ts
const video = await createPlayer(canvas, {
  baseURL: animationBaseUrl(),
  scene: { ...scene, size: [960, 540], loop: false },
  reducedMotion: false,
  pixelRatio: 4,
  imageFormat: "png",
});
// RAF 없이 소비자가 프레임 시계를 소유합니다.
video.render(frameIndex / 60);
const pngFrame = await new Promise<Blob>((resolve, reject) =>
  canvas.toBlob(
    (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
    "image/png",
  ),
);
```

선언형 `nodes`는 같은 시점에 같은 프레임을 생성하며 역순 탐색도 가능합니다. 영상의 이펙트는 `start/duration` 노드로 작성하세요. `emit()`은 홈페이지 클릭 반응용 임시 이펙트이며 지난 이벤트를 역순 재생하는 타임라인 기능이 아닙니다. 6초/60fps 영상은 0~359 프레임을 캡처하고 PNG 시퀀스를 FFmpeg 등에서 인코딩합니다. 패키지는 MP4 인코더를 포함하지 않습니다.

## 검토 범위

웹: 투명 배경, 화면 배율, reduced motion, 독립 장치, 손 소켓 도구 교체. 영상: 고정 시점 렌더, 끝 프레임, PNG 글꼴 고정, Full HD/4K 크기. 캐릭터의 친근한 비율은 유지됩니다. 최종 홈페이지의 배경 대비, 모바일 크기, 실제 편집 영상의 리듬과 자막 배치는 소비 프로젝트에서 확인해야 합니다.

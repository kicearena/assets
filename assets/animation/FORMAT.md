# Format v1

좌표는 논리 픽셀, X는 오른쪽, Y는 아래쪽입니다. 장면 회전·부품 회전은 라디안, 캐릭터 원본 `poses`의 본 채널은 도입니다. `character.json`의 `model.bones[].localBind.angle` 역시 도입니다. 픽셀 배율은 재생기 canvas의 pixelRatio에만 적용합니다.

## 에셋

- `files.svg/png`: catalog.json과 같은 폴더 기준 URL입니다. PNG는 SVG보다8배 큰 투명 래스터입니다.
- `size`: 전체 논리 프레임 크기. `pivot`: 해당 프레임 안의 원점입니다.
- `parts`: 모두 같은 프레임에 그린 분리 부품입니다. 부품 순서가 아래→위 레이어입니다. 각 부품은 자신의 pivot 주위로 움직입니다.
- `tracks`: x, y, rotation, scaleX, scaleY, opacity의 키 배열입니다. 각 키는 `[정규화 시점, 값]`이며 시점은0~1입니다. 위치와 회전은 기본 자세에서의 변화량, 배율·불투명도는 절대값입니다. 인접 키 사이에는 smoothstep을 적용합니다. 없는 채널은 위치/회전0, 배율/불투명도1입니다.
- `duration`, `loop`: 부품과 에셋의 트랙 재생 길이 및 반복 여부입니다.
- `sockets`: `{position:[x,y], part?:"부품ID"}`. 부품 ID가 있으면 그 부품의 pivot/트랙을 적용한 점을 돌려줍니다. 태그 장면에 종속되지 않는 장치 부착점입니다.

## 장면

`size`, `duration`, `loop`, `posterTime`, `nodes`를 가집니다. 노드는 character/action 또는 asset 중 하나를 지정합니다. `position`은 부모 원점을 기준으로 한 위치이고, `scale`, `mirror`, `rotation` 뒤에 노드의 tracks가 적용됩니다. 전체 z순서로 합성하므로 부모 관계와 레이어 순서는 독립적입니다.

`parent`만 지정하면 부모의 에셋 원점을 따릅니다. `socket`도 지정하면 부모의 부착점을 따릅니다. 캐릭터는 본 끝점에 소켓이 있습니다. 부모가 퇴장하여 투명해지면 자식도 함께 투명해집니다. `start`와 `duration`은 장면 초 단위이며 활성 구간은 `[start,start+duration]`입니다.

18개 기본 장면은6초입니다. 장치 등장→고유 부품 동작→캐릭터 반응→퇴장을 갖습니다. 캐릭터의 원래 모션 속도를 유지하고 일회 동작은 마지막 자세에서 멈춥니다. 각 노드의 트랙·시작 시점·동작·위치는 JSON을 편집해 바꿀 수 있습니다.

`timeScale`은 클립 재생 속도(0 이상, 0이면 고정), `timeOffset`은 클립 시작 오프셋(초)입니다. 노드의 노출 시점과 tracks는 장면 시간을 따릅니다. `showMotionTool: false`로 모션 기본 도구를 숨기고 별도 도구 노드를 손 소켓에 연결할 수 있습니다.

## 캐릭터

`model`에는 부모 관계, 로컬 관절 위치, 길이, 그림 파트와 소켓이 있습니다. `motions`에는24fps 포즈와 toolAttachment가 있습니다. 포즈를 보간한 뒤 순방향 관절 계산으로 팔·다리 길이를 유지합니다. 기존48프레임 PNG의 관절과 같은 모델입니다. toolAttachment의 rotationFrames는 손 소켓에 대한 라디안 상대 회전입니다.

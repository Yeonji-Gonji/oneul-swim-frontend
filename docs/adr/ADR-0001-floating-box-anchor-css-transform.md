# ADR-0001: 지도 플로팅박스의 하단 중앙 앵커는 kakao anchor 대신 CSS transform 으로 잡는다

- 날짜: 2026-07-20 (2026-10-26 복원, 구 ADR-008)
- 상태: 채택
- 관련: `components/map/MapExplorer.tsx` 플로팅박스 오버레이 effect

## 배경

마커를 고르면 그 위에 시설 요약 박스(`PoolFloatingBox`)를 kakao `CustomOverlay` 로 띄운다. 박스 내용은 React 포털로 그리므로
오버레이를 만들 때 content 는 아직 빈 `div` 다. kakao 의 `xAnchor`/`yAnchor` 오프셋은 content 크기를 재서 계산하는데,
빈 상태에서 만들면 크기 0 기준으로 굳어 박스가 마커 위가 아니라 오른쪽 아래로 밀려 그려졌다.

## 검토한 대안

1. 포털 렌더가 끝난 뒤 오버레이를 만든다 — 생성 시점을 렌더 사이클에 묶어야 해 effect 가 복잡해지고, 내용 크기가 바뀌면 다시 어긋난다.
2. kakao anchor 는 0 으로 두고 content 요소에 `transform: translate(-50%, -100%)` 를 준다 — 크기와 무관하게 하단 중앙이 좌표에 붙는다. (채택)

## 결정

`xAnchor: 0, yAnchor: 0` + content 요소 `style.transform = 'translate(-50%, -100%)'`. 오버레이는 한 번 만들고 좌표만 `setPosition` 으로 옮긴다.

## 결과

- 박스 내용 크기가 바뀌어도 위치가 유지된다. kakao anchor 옵션을 다시 쓰면 같은 버그가 돌아온다.

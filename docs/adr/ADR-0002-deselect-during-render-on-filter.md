# ADR-0002: 필터 변경으로 선택한 시설이 결과에서 빠지면 렌더 중에 선택을 해제한다

- 날짜: 2026-07-20 (2026-10-26 복원, 구 ADR-009)
- 상태: 채택
- 관련: `components/map/MapExplorer.tsx` `selectedPool` 파생부

## 배경

지도에서 시설을 고른 상태로 지역·날짜·상태 필터를 바꾸면, 고른 시설이 필터 결과에서 빠질 수 있다. 이때 `selectedId` 가 남아 있으면
보이지 않는 시설의 플로팅박스가 뜨거나, 필터를 되돌렸을 때 예전 선택이 갑자기 다시 나타났다.

## 검토한 대안

1. `useEffect` 로 필터 변경을 감지해 `setSelectedId(null)` — 한 번 그린 뒤 다시 그려 박스가 한 프레임 깜빡이고 렌더가 두 번 돈다.
2. 선택 대상은 필터 결과에서 찾아 파생(`selectedPool`)하고, 찾지 못하면 렌더 중에 바로 `setSelectedId(null)` — React 가 같은 렌더 안에서
   상태를 다시 계산해 깜빡임이 없다(공식 문서의 "이전 렌더 정보 저장" 패턴). (채택)

## 결정

`selectedPool = filteredPools.find(id)`. `selectedId !== null && selectedPool === null` 이면 렌더 중 `setSelectedId(null)`.

## 결과

- 필터를 되돌려도 예전 선택이 살아나지 않는다(의도된 동작).
- 이 조건문은 무한 렌더를 막기 위해 "선택이 있고 결과에 없을 때"로만 좁혀 둔다. 조건을 넓히면 렌더 루프가 생긴다.

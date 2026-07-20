/**
 * Kakao Maps JS SDK 최소 타입 선언.
 * 공식 타입 패키지를 쓰지 않고, 코드에서 실제 사용하는 표면(API surface)만 정의한다.
 * 새 API를 쓰게 되면 여기에 시그니처를 추가한다.
 *
 * 타입 주석(kakao.maps.Map 등)이 다른 파일에서도 쓰이므로 네임스페이스를 `declare global` 안에 둔다.
 */

export {};

declare global {
  namespace kakao.maps {
    /** autoload=false 로드 후 SDK 준비 콜백 */
    function load(callback: () => void): void;

    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      extend(latlng: LatLng): void;
      isEmpty(): boolean;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    interface MapOptions {
      center: LatLng;
      level: number;
    }

    interface SetLevelOptions {
      /** 줌 전후 화면 위치를 고정할 좌표 */
      anchor?: LatLng;
      animate?: boolean | { duration: number };
    }

    /** 지도 좌표계 ↔ 컨테이너 픽셀 좌표 변환 */
    class MapProjection {
      containerPointFromCoords(latlng: LatLng): Point;
      coordsFromContainerPoint(point: Point): LatLng;
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setBounds(bounds: LatLngBounds): void;
      setCenter(latlng: LatLng): void;
      panTo(latlng: LatLng): void;
      setLevel(level: number, options?: SetLevelOptions): void;
      getLevel(): number;
      getCenter(): LatLng;
      setMaxLevel(maxLevel: number): void;
      getProjection(): MapProjection;
    }

    interface MarkerImageOptions {
      offset?: Point;
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: MarkerImageOptions);
    }

    interface MarkerOptions {
      position: LatLng;
      image?: MarkerImage;
      title?: string;
      zIndex?: number;
      map?: Map;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng;
    }

    interface CustomOverlayOptions {
      position: LatLng;
      xAnchor?: number;
      yAnchor?: number;
      zIndex?: number;
      content: HTMLElement | string;
      /** true면 오버레이 내부 클릭이 지도 click 이벤트로 전파되지 않음 */
      clickable?: boolean;
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng): void;
    }

    interface MarkerClustererOptions {
      map: Map;
      averageCenter?: boolean;
      minLevel?: number;
      disableClickZoom?: boolean;
      markers?: Marker[];
      styles?: Record<string, string>[];
      minClusterSize?: number;
    }

    class MarkerClusterer {
      constructor(options: MarkerClustererOptions);
      addMarkers(markers: Marker[]): void;
      clear(): void;
    }

    namespace event {
      function addListener(
        target: object,
        type: string,
        handler: (...args: unknown[]) => void,
      ): void;
    }
  }

  interface Window {
    /** Kakao Maps SDK. 스크립트 로드 전에는 undefined일 수 있다. */
    kakao?: typeof kakao;
  }
}

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
    }

    interface MapOptions {
      center: LatLng;
      level: number;
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setBounds(bounds: LatLngBounds): void;
      setCenter(latlng: LatLng): void;
      panTo(latlng: LatLng): void;
      setLevel(level: number): void;
      getLevel(): number;
      getCenter(): LatLng;
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
      yAnchor?: number;
      zIndex?: number;
      content: HTMLElement | string;
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

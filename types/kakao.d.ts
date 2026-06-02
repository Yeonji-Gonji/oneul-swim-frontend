/**
 * Kakao Maps JS SDK 최소 타입 선언.
 * 공식 타입 패키지를 쓰지 않고, MapView에서 실제 사용하는 표면(API surface)만 정의한다.
 * 새 API를 쓰게 되면 여기에 시그니처를 추가한다.
 */
declare namespace kakao.maps {
  /** autoload=false 로드 후 SDK 준비 콜백 */
  function load(callback: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
  }

  interface MapOptions {
    center: LatLng;
    level: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setBounds(bounds: LatLngBounds): void;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    yAnchor?: number;
    content: HTMLElement | string;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }
}

declare global {
  interface Window {
    /** Kakao Maps SDK. 스크립트 로드 전에는 undefined일 수 있다. */
    kakao?: typeof kakao;
  }
}

export {};

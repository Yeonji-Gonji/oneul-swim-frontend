import { redirect } from 'next/navigation';

// 홈(/)이 지도-퍼스트로 통합됨 → 구 /map 은 홈으로 영구 이동.
export default function MapPage() {
  redirect('/');
}

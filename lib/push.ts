/**
 * 아침 요약 Web Push 구독. 흐름:
 * 알림 권한 요청 → 서비스워커의 pushManager 구독 → 구독 정보를 서버에 저장.
 * 구독 여부의 진실은 브라우저(pushManager)가 갖고, 서버는 발송 목록만 관리한다.
 */

import { trackEvent } from './analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** 강습 접수 소식 서버구독 여부(로컬 캐시). 진실 확인은 getLessonPushEnabled 참고 */
const LESSON_FLAG_KEY = 'oneul-swim:lesson-push';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isPushConfigured(): boolean {
  return Boolean(API_URL && VAPID_PUBLIC_KEY);
}

/** 현재 브라우저가 구독 중인지 (등록된 SW가 없으면 구독도 없음) */
export async function getPushEnabled(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  return Boolean(await reg.pushManager.getSubscription());
}

/**
 * 활성 서비스워커 확보. register는 멱등이라 안전하고,
 * `serviceWorker.ready`는 실패 시 영원히 pending이라 시간제한을 건다.
 */
async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    await navigator.serviceWorker.register('/sw.js');
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000)),
    ]);
  } catch {
    return null;
  }
}

export type PushResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'denied' | 'no-backend' | 'network' };

export async function enablePush(): Promise<PushResult> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  if (!isPushConfigured()) return { ok: false, reason: 'no-backend' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    const reg = await readyRegistration();
    if (!reg) return { ok: false, reason: 'network' };
    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // 대시보드에 붙여넣은 키의 공백·개행에 관대하게
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!.trim()),
      }));

    const res = await fetch(`${API_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!res.ok) return { ok: false, reason: 'network' };
    // 측정: 푸시 구독 성공 (GA 미설정 시 no-op)
    trackEvent('push_subscribe', { kind: 'morning' });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function disablePush(): Promise<PushResult> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return { ok: true }; // SW가 없으면 구독도 없다
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      // 서버 목록에서 먼저 제거 (실패해도 다음 발송 때 410으로 자동 정리됨)
      if (API_URL) {
        await fetch(`${API_URL}/subscriptions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => undefined);
      }
      await subscription.unsubscribe();
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/* ---- 강습 "접수 소식 알림" 서버 구독 ----
 * 아침 요약(/subscriptions)과 동일한 SW/pushManager 구독 흐름을 재사용하되,
 * 발송 목록만 /subscriptions/lessons로 분리한다. 브라우저 구독(pushManager)은
 * 아침 요약과 공유하므로, 구독 해제 시 unsubscribe하지 않고 목록에서만 뺀다. */

/** 현재 브라우저 구독을 {endpoint,p256dh,auth} 평면 형태로 변환 */
function toFlatSubscription(
  sub: PushSubscription,
): { endpoint: string; p256dh: string; auth: string } | null {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  };
}

/**
 * 강습 접수 소식 서버구독 여부.
 * 로컬 플래그가 켜져 있고 실제 브라우저 구독도 살아있을 때만 true.
 * (아침 요약을 끄면서 브라우저 구독이 해제되면 자동으로 false가 된다.)
 */
export async function getLessonPushEnabled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(LESSON_FLAG_KEY) !== '1') return false;
  return getPushEnabled();
}

export async function enableLessonPush(): Promise<PushResult> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  if (!isPushConfigured()) return { ok: false, reason: 'no-backend' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    const reg = await readyRegistration();
    if (!reg) return { ok: false, reason: 'network' };
    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!.trim()),
      }));

    const flat = toFlatSubscription(subscription);
    if (!flat) return { ok: false, reason: 'network' };

    const res = await fetch(`${API_URL}/subscriptions/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flat),
    });
    if (!res.ok) return { ok: false, reason: 'network' };
    localStorage.setItem(LESSON_FLAG_KEY, '1');
    // 측정: 푸시 구독 성공 (GA 미설정 시 no-op)
    trackEvent('push_subscribe', { kind: 'lessons' });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function disableLessonPush(): Promise<PushResult> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  try {
    localStorage.removeItem(LESSON_FLAG_KEY);
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return { ok: true };
    const subscription = await reg.pushManager.getSubscription();
    // 브라우저 구독은 아침 요약과 공유하므로 unsubscribe하지 않는다.
    // 강습 발송 목록에서만 제거(실패해도 다음 발송 때 410으로 정리됨).
    if (subscription && API_URL) {
      await fetch(`${API_URL}/subscriptions/lessons`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => undefined);
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  // BufferSource 타입을 만족시키기 위해 ArrayBuffer 기반으로 명시적 생성
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

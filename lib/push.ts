/**
 * 아침 요약 Web Push 구독. 흐름:
 * 알림 권한 요청 → 서비스워커의 pushManager 구독 → 구독 정보를 서버에 저장.
 * 구독 여부의 진실은 브라우저(pushManager)가 갖고, 서버는 발송 목록만 관리한다.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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

/** 현재 브라우저가 구독 중인지 */
export async function getPushEnabled(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  return Boolean(await reg.pushManager.getSubscription());
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
    const reg = await navigator.serviceWorker.ready;
    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      }));

    const res = await fetch(`${API_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!res.ok) return { ok: false, reason: 'network' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function disablePush(): Promise<PushResult> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  try {
    const reg = await navigator.serviceWorker.ready;
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

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  // BufferSource 타입을 만족시키기 위해 ArrayBuffer 기반으로 명시적 생성
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

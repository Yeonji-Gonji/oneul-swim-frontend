import Script from 'next/script';

/**
 * GA4(gtag) 로더 — NEXT_PUBLIC_GA_ID가 있을 때만 렌더한다.
 * env가 없으면 아무것도 렌더하지 않아 번들·네트워크 부담이 0이다.
 * afterInteractive 전략으로 초기 로딩을 방해하지 않는다.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}

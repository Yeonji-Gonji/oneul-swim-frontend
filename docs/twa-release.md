# TWA(안드로이드 앱) 출시 절차

오늘수영 PWA를 안드로이드 스토어에 올리려면 TWA(Trusted Web Activity)로 감싸야 한다.
이 문서는 서명키(SHA256)를 얻어 `assetlinks.json`을 교체하고 스토어에 등록하는 절차를 정리한다.

> 코드로 완결할 수 없는 부분(실서명 SHA256, 스토어 계정)은 사용자가 직접 해야 한다.
> `public/.well-known/assetlinks.json`은 지문 자리표시자(`REPLACE_WITH_SHA256_FINGERPRINT_FROM_PWABUILDER`)로 남겨두었다.

## 1. Bubblewrap으로 TWA 프로젝트 생성

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://<배포도메인>/manifest.webmanifest
```

- `applicationId`(패키지명)는 `assetlinks.json`의 `package_name`과 반드시 일치해야 한다.
  현재 자리표시자: `io.github.modac0.oneulswim`. 실제 값으로 확정 후 양쪽을 맞춘다.
- `host`는 실제 배포 도메인(예: Vercel 도메인 또는 커스텀 도메인).

## 2. 빌드 → 키스토어 생성 & SHA256 획득

```bash
bubblewrap build
```

- 최초 빌드 시 서명 키스토어(`.keystore`)를 만든다. **이 파일과 비밀번호는 분실 시 앱 업데이트가 불가능**하므로 안전하게 보관한다.
- 키스토어의 SHA256 지문 확인:

```bash
keytool -list -v -keystore android.keystore -alias <alias>
```

출력의 `SHA256:` 값(콜론 포함 16진수)이 assetlinks에 넣을 지문이다.

> PWABuilder(https://www.pwabuilder.com)로 대신 패키징하는 경우,
> 생성된 패키지 안내에 동일한 SHA256 지문이 포함되어 있다.

## 3. assetlinks.json 교체

`public/.well-known/assetlinks.json`의 자리표시자를 실제 지문으로 바꾼다.

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "io.github.modac0.oneulswim",
      "sha256_cert_fingerprints": [
        "<여기에 실제 SHA256 지문>"
      ]
    }
  }
]
```

- Play Console의 **Play 앱 서명**을 쓰면 스토어가 재서명하므로, 그때는
  콘솔에 표시된 **앱 서명 키의 SHA256**을 넣어야 한다(업로드 키가 아님).
- 배포 후 `https://<도메인>/.well-known/assetlinks.json`이 200으로 열리고
  `Content-Type: application/json`인지 확인한다. (링크 검증 실패 시 주소창이 뜬다.)

## 4. 스토어 등록

1. Google Play Console에서 앱 생성 → `bubblewrap build` 산출물(`app-release-bundle.aab`) 업로드.
2. 스토어 등록정보(아이콘·스크린샷·설명) 작성.
3. 내부 테스트 트랙에 먼저 올려 TWA가 주소창 없이 전체화면으로 뜨는지 확인.
4. 문제없으면 프로덕션 출시.

## 사용자가 직접 해야 하는 것 (요약)

- [ ] 배포 도메인 확정 및 `manifest.webmanifest` 접근 확인
- [ ] `applicationId`(패키지명) 확정 → `assetlinks.json`과 일치
- [ ] Bubblewrap/PWABuilder로 빌드 후 **키스토어·비밀번호 안전 보관**
- [ ] SHA256 지문으로 `assetlinks.json` 교체 후 재배포
- [ ] Google Play Console 계정으로 스토어 등록

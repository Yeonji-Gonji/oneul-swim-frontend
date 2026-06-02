import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: '개인정보처리방침 — 오늘수영',
  description: '오늘수영이 이용자 정보를 어떻게 다루는지 안내합니다.',
};

/** 운영자 연락처 — Google Play 등록 및 문의 응대용. 공개 페이지에 노출됩니다. */
const CONTACT_EMAIL = 'upfall.juni@gmail.com';
const EFFECTIVE_DATE = '2026년 6월 2일';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-text">{title}</h2>
      <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-text-sub">
        {children}
      </div>
    </section>
  );
}

/** 개인정보처리방침 — Google Play 등록 필수 문서. 위치정보 사용 고지 포함. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pb-16 pt-12">
      <Header variant="back" title="개인정보처리방침" backHref="/more" />

      <p className="text-[13px] leading-relaxed text-text-sub">
        오늘수영(이하 ‘서비스’)은 하남 지역 자유수영 정보를 제공하는
        비영리 정보 서비스입니다. 본 방침은 서비스가 이용자의 정보를 어떻게
        다루는지 설명합니다. 시행일: {EFFECTIVE_DATE}.
      </p>

      <Section title="1. 수집하지 않는 정보">
        <p>
          서비스는 회원가입 절차가 없으며, 이름·이메일·전화번호 등 이용자를
          식별할 수 있는 개인정보를 수집하거나 서버에 저장하지 않습니다.
        </p>
      </Section>

      <Section title="2. 위치정보">
        <p>
          가까운 수영장을 거리순으로 보여주기 위해 기기의 위치정보를 사용할 수
          있습니다. 위치정보는 이용자가 브라우저 권한에 동의한 경우에만
          이용되며, <strong className="text-text">기기 내에서만 처리</strong>
          되고 서비스 서버나 제3자에게 전송·저장되지 않습니다. 권한은 브라우저
          또는 기기 설정에서 언제든지 해제할 수 있으며, 해제 시 거리 정렬 대신
          지역명 기준으로 표시됩니다.
        </p>
      </Section>

      <Section title="3. 제보 정보">
        <p>
          이용자가 자발적으로 제출하는 시설 운영정보·사진 등의 제보는 데이터
          정확도를 높이기 위한 검수·반영 목적으로만 사용합니다. 제보에는
          개인을 식별할 수 있는 정보를 포함하지 않도록 권장합니다.
        </p>
      </Section>

      <Section title="4. 지도 서비스">
        <p>
          위치 표시에 카카오 지도(Kakao Maps) SDK를 사용합니다. 지도 이용 과정은
          카카오의 개인정보 처리방침이 함께 적용됩니다.
        </p>
      </Section>

      <Section title="5. 광고 및 분석">
        <p>
          서비스는 광고를 게재하지 않으며, 이용자 행동을 추적하는 제3자 분석
          도구를 사용하지 않습니다.
        </p>
      </Section>

      <Section title="6. 알림">
        <p>
          이용자가 알림을 구독한 경우 운영시간 요약 등 정보성 알림을 보낼 수
          있습니다. 구독은 언제든지 해제할 수 있습니다.
        </p>
      </Section>

      <Section title="7. 방침의 변경">
        <p>
          본 방침이 변경되는 경우 본 페이지를 통해 고지합니다.
        </p>
      </Section>

      <Section title="8. 문의">
        <p>
          개인정보 처리에 관한 문의는 아래로 연락해 주세요.
          <br />
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-primary underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </main>
  );
}

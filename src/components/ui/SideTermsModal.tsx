'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SideTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | 'marketing';
}

const TERMS_CONTENT = {
  terms: {
    title: '이용약관',
    content: `제1조 (목적)
이 약관은 크리스마스 특가 웹사이트 제작 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스의 내용)
1. 회사는 랜딩페이지/웹사이트 제작 서비스를 제공합니다.
2. 크리스마스 특가 이벤트는 선착순 3명에 한하여 적용됩니다.
3. 서비스의 구체적인 내용과 범위는 상담 후 협의하여 결정합니다.

제3조 (신청 및 계약)
1. 이용자는 본 서비스를 통해 웹사이트 제작을 신청할 수 있습니다.
2. 신청 후 회사에서 연락을 드리며, 상담을 통해 최종 계약이 체결됩니다.
3. 허위 정보로 신청한 경우 신청이 취소될 수 있습니다.

제4조 (이용자의 의무)
1. 이용자는 정확한 연락처 정보를 제공해야 합니다.
2. 타인의 정보를 도용하여 신청해서는 안 됩니다.
3. 서비스를 부정하게 이용해서는 안 됩니다.

제5조 (회사의 의무)
1. 회사는 신청 접수 후 빠른 시일 내에 연락드립니다.
2. 이용자의 개인정보를 관련 법령에 따라 보호합니다.
3. 합의된 서비스 내용에 따라 웹사이트를 제작합니다.

제6조 (면책조항)
1. 천재지변 등 불가항력으로 인한 서비스 제공 불가 시 회사는 책임을 지지 않습니다.
2. 이용자의 귀책사유로 인한 손해에 대해 회사는 책임을 지지 않습니다.

제7조 (분쟁해결)
서비스 이용과 관련한 분쟁은 회사의 소재지를 관할하는 법원을 관할법원으로 합니다.

부칙
이 약관은 2024년 12월 1일부터 시행합니다.`,
  },
  privacy: {
    title: '개인정보 처리방침',
    content: `1. 수집하는 개인정보 항목
- 필수항목: 성함, 연락처(휴대폰)

2. 개인정보의 수집 및 이용목적
- 웹사이트 제작 상담 및 안내
- 서비스 제공을 위한 연락
- 계약 체결 및 이행

3. 개인정보의 보유 및 이용기간
- 상담 완료 후 1년간 보관
- 계약 체결 시 계약 종료 후 5년간 보관 (상법)
- 관련 법령에 따른 보존 의무가 있는 경우 해당 기간

4. 개인정보의 제3자 제공
- 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
- 법령에 의한 경우 또는 이용자의 동의가 있는 경우에 한해 제공합니다.

5. 개인정보의 파기절차 및 방법
- 보유기간이 경과한 개인정보는 지체 없이 파기합니다.
- 전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제

6. 이용자의 권리와 행사방법
- 개인정보 열람, 정정, 삭제, 처리정지 요청 가능
- 이메일 또는 전화를 통해 요청 가능

7. 개인정보의 안전성 확보 조치
- 개인정보 암호화
- 해킹 등에 대비한 기술적 대책
- 개인정보 접근 제한

시행일: 2024년 12월 1일`,
  },
  marketing: {
    title: '마케팅 정보 수신 동의',
    content: `1. 마케팅 정보 수신 동의 안내

본 동의는 선택사항이며, 동의하지 않으셔도 서비스 이용에 제한이 없습니다.

2. 수집 및 이용 목적
- 신규 서비스 및 이벤트 안내
- 프로모션 및 할인 혜택 정보 제공
- 맞춤형 서비스 추천

3. 수집 항목
- 연락처(휴대폰)

4. 보유 및 이용 기간
- 동의 철회 시까지

5. 마케팅 정보 수신 방법
- SMS/문자 메시지

6. 동의 철회 방법
- 수신된 문자 메시지 내 수신거부 안내에 따라 철회
- 고객센터를 통한 철회 요청

※ 마케팅 정보 수신에 동의하시면 다양한 혜택과 이벤트 정보를 받아보실 수 있습니다.`,
  },
};

export function SideTermsModal({ isOpen, onClose, type }: SideTermsModalProps) {
  const content = TERMS_CONTENT[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-red-900/30">
              <h2 className="text-xl font-bold text-white">{content.title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 내용 */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 130px)' }}>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
                {content.content}
              </pre>
            </div>

            {/* 푸터 */}
            <div className="border-t border-white/10 px-6 py-4">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3 font-bold text-white hover:from-red-400 hover:to-red-500 transition-all"
              >
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

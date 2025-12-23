'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const TERMS_CONTENT = {
  terms: {
    title: '이용약관',
    content: `제1조 (목적)
이 약관은 럭키드로우 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스의 내용)
1. 회사는 럭키드로우 이벤트 예약 및 진행 서비스를 제공합니다.
2. 서비스의 구체적인 내용은 회사의 사정에 따라 변경될 수 있습니다.

제3조 (예약 및 취소)
1. 이용자는 본 서비스를 통해 이벤트를 예약할 수 있습니다.
2. 예약 확정 후 취소 시 회사의 취소 정책에 따릅니다.
3. 허위 정보로 예약한 경우 예약이 취소될 수 있습니다.

제4조 (이용자의 의무)
1. 이용자는 정확한 정보를 제공해야 합니다.
2. 타인의 정보를 도용하여 예약해서는 안 됩니다.
3. 서비스를 부정하게 이용해서는 안 됩니다.

제5조 (회사의 의무)
1. 회사는 안정적인 서비스 제공을 위해 노력합니다.
2. 이용자의 개인정보를 관련 법령에 따라 보호합니다.
3. 예약 확정 시 이용자에게 안내를 제공합니다.

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
- 필수항목: 성함, 연락처(휴대폰), 이메일
- 선택항목: 회사/단체명, 이벤트 설명

2. 개인정보의 수집 및 이용목적
- 이벤트 예약 접수 및 확인
- 예약 관련 안내 및 상담
- 서비스 제공 및 고객 응대
- 마케팅 및 프로모션 정보 제공 (동의 시)

3. 개인정보의 보유 및 이용기간
- 예약 정보: 이벤트 종료 후 1년
- 마케팅 동의 정보: 동의 철회 시까지
- 관련 법령에 따른 보존 의무가 있는 경우 해당 기간

4. 개인정보의 제3자 제공
- 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
- 법령에 의한 경우 또는 이용자의 동의가 있는 경우에 한해 제공합니다.

5. 개인정보의 파기절차 및 방법
- 보유기간이 경과한 개인정보는 지체 없이 파기합니다.
- 전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제
- 종이 문서: 분쇄기로 파쇄 또는 소각

6. 이용자의 권리와 행사방법
- 개인정보 열람, 정정, 삭제, 처리정지 요청 가능
- 이메일 또는 전화를 통해 요청 가능
- 요청 시 본인 확인 절차를 거칩니다.

7. 개인정보의 안전성 확보 조치
- 개인정보 암호화
- 해킹 등에 대비한 기술적 대책
- 개인정보 접근 제한

8. 개인정보 보호책임자
- 담당부서: 고객서비스팀
- 연락처: 이메일로 문의

9. 개인정보 처리방침 변경
- 이 개인정보 처리방침은 법령 및 방침에 따라 변경될 수 있습니다.
- 변경 시 공지사항을 통해 안내드립니다.

시행일: 2024년 12월 1일`,
  },
};

export function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
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
            className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">{content.title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
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
            <div className="border-t border-gray-700 px-6 py-4">
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black hover:bg-yellow-400"
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

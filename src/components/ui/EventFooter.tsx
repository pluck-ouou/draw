'use client';

import { motion } from 'framer-motion';
import { Building2, Phone, Shield } from 'lucide-react';
import type { Sponsor } from '@/lib/supabase/types';

interface EventFooterProps {
  footerText?: string;
  contactInfo?: string;
  privacyUrl?: string;
  sponsors?: Sponsor[];
  themeColor?: string;
}

export function EventFooter({
  footerText,
  contactInfo,
  privacyUrl,
  sponsors,
  themeColor = '#facc15',
}: EventFooterProps) {
  const hasSponsors = sponsors && sponsors.length > 0;
  const hasInfo = footerText || contactInfo || privacyUrl;

  if (!hasSponsors && !hasInfo) return null;

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 w-full"
    >
      {/* 스폰서 로고 */}
      {hasSponsors && (
        <div className="mb-4 rounded-xl bg-gray-800/30 p-4">
          <p className="mb-3 text-center text-xs text-gray-500">협찬사</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {sponsors?.map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.link_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                {sponsor.logo_url ? (
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    className="h-8 max-w-[120px] object-contain"
                  />
                ) : (
                  <span className="text-sm text-gray-400">{sponsor.name}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 하단 정보 */}
      {hasInfo && (
        <div className="rounded-xl bg-gray-800/30 p-4 text-center text-sm text-gray-500">
          {/* 기업/이벤트 정보 */}
          {footerText && (
            <div className="mb-2 flex items-center justify-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{footerText}</span>
            </div>
          )}

          {/* 문의처 */}
          {contactInfo && (
            <div className="mb-2 flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{contactInfo}</span>
            </div>
          )}

          {/* 개인정보 처리방침 */}
          {privacyUrl && (
            <a
              href={privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-400 hover:underline"
              style={{ color: themeColor }}
            >
              <Shield className="h-3 w-3" />
              개인정보 처리방침
            </a>
          )}
        </div>
      )}
    </motion.footer>
  );
}

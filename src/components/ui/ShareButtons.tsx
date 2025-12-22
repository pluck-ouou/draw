'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  themeColor?: string;
}

export function ShareButtons({
  title,
  description,
  url,
  themeColor = '#facc15',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareKakao = () => {
    if (typeof window !== 'undefined' && (window as unknown as { Kakao?: { Share?: { sendDefault: (options: unknown) => void } } }).Kakao?.Share) {
      (window as unknown as { Kakao: { Share: { sendDefault: (options: unknown) => void } } }).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description || '럭키드로우에 참여해보세요!',
          imageUrl: 'https://your-domain.com/og-image.png',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '참여하기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    } else {
      // 카카오 SDK 없으면 웹 공유 사용
      window.open(
        `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || '럭키드로우에 참여해보세요!',
          url: shareUrl,
        });
      } catch (e) {
        // 사용자가 취소한 경우
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">공유하기</span>

      {/* 링크 복사 */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={copyLink}
        className="flex items-center gap-1 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" style={{ color: themeColor }} />
            복사됨
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            링크
          </>
        )}
      </motion.button>

      {/* 카카오톡 */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={shareKakao}
        className="flex items-center gap-1 rounded-lg bg-[#FEE500] px-3 py-2 text-sm font-medium text-[#3C1E1E] hover:bg-[#FDD835]"
      >
        <MessageCircle className="h-4 w-4" />
        카카오
      </motion.button>

      {/* 네이티브 공유 (모바일) */}
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={shareNative}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-black hover:opacity-90"
          style={{ backgroundColor: themeColor }}
        >
          <Share2 className="h-4 w-4" />
          공유
        </motion.button>
      )}
    </div>
  );
}

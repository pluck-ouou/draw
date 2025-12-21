'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { Template, TemplateSlot } from '@/lib/supabase/types';
import { Ornament, SpriteConfig, DEFAULT_SPRITE_CONFIG } from '@/components/Ornament';
import { SpriteAdjuster } from '@/components/SpriteAdjuster';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  Save,
  RefreshCw,
  Move,
  ZoomIn,
  ZoomOut,
  Palette,
  Settings,
  Star,
  X,
  Sliders,
  Upload,
  Image,
  Trash2,
} from 'lucide-react';

// 기본 트리 위치 (삼각형 패턴)
const TREE_ROWS = [
  { count: 1, top: 6 },
  { count: 3, top: 12 },
  { count: 5, top: 18 },
  { count: 7, top: 24 },
  { count: 9, top: 30 },
  { count: 11, top: 37 },
  { count: 13, top: 44 },
  { count: 15, top: 52 },
  { count: 17, top: 60 },
  { count: 19, top: 68 },
];

function getDefaultPositions(): { top: number; left: number }[] {
  const positions: { top: number; left: number }[] = [];
  TREE_ROWS.forEach((row) => {
    const spacing = 4.2;
    const startLeft = 50 - ((row.count - 1) * spacing) / 2;
    for (let i = 0; i < row.count; i++) {
      positions.push({
        top: row.top,
        left: startLeft + i * spacing,
      });
    }
  });
  return positions;
}

const DEFAULT_POSITIONS = getDefaultPositions();

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [slots, setSlots] = useState<TemplateSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 위치 에디터 상태
  const [selectedSlot, setSelectedSlot] = useState<TemplateSlot | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tempPositions, setTempPositions] = useState<Record<string, { top: number; left: number }>>({});
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 400, height: 400 });

  // 모달 상태
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [modalTab, setModalTab] = useState<'position' | 'sprite'>('position');

  // 스프라이트 전역 설정
  const [showSpriteSettings, setShowSpriteSettings] = useState(false);
  const [spriteConfig, setSpriteConfig] = useState<SpriteConfig>(DEFAULT_SPRITE_CONFIG);
  const [spriteImageSize, setSpriteImageSize] = useState<{ width: number; height: number } | null>(null);

  // 이미지 업로드 상태
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isUploadingSprite, setIsUploadingSprite] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const spriteInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // 스프라이트 설정 불러오기 (템플릿 DB에서, imageWidth/imageHeight 유지)
  useEffect(() => {
    if (template?.sprite_config) {
      setSpriteConfig(prev => ({
        ...(template.sprite_config as SpriteConfig),
        imageWidth: (template.sprite_config as SpriteConfig).imageWidth || prev.imageWidth,
        imageHeight: (template.sprite_config as SpriteConfig).imageHeight || prev.imageHeight,
      }));
    }
  }, [template?.sprite_config]);

  // 스프라이트 이미지 크기 자동 감지 - 항상 실제 이미지 크기로 업데이트
  useEffect(() => {
    const imageUrl = template?.sprite_image;
    if (imageUrl) {
      const img = new window.Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        setSpriteImageSize({ width: naturalWidth, height: naturalHeight });
        // 항상 실제 이미지 크기로 업데이트 (DB 값과 상관없이)
        setSpriteConfig(prev => ({
          ...prev,
          imageWidth: naturalWidth,
          imageHeight: naturalHeight,
        }));
      };
      img.src = imageUrl;
    }
  }, [template?.sprite_image]);

  // 배경 이미지 비율 가져오기
  useEffect(() => {
    const imageUrl = template?.background_image || '/tree.png';
    const img = new window.Image();
    img.onload = () => {
      // 최대 너비 400px 기준으로 비율 유지
      const maxWidth = 400;
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      setImageDimensions({
        width: maxWidth,
        height: Math.round(maxWidth * aspectRatio),
      });
    };
    img.src = imageUrl;
  }, [template?.background_image]);

  // 데이터 로딩
  const fetchData = async () => {
    try {
      // 템플릿 정보
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;
      setTemplate(templateData);

      // 슬롯 정보
      const { data: slotsData, error: slotsError } = await supabase
        .from('template_slots')
        .select('*')
        .eq('template_id', templateId)
        .order('slot_number');

      if (slotsError) throw slotsError;
      setSlots(slotsData || []);

      // 임시 위치 설정
      const positions: Record<string, { top: number; left: number }> = {};
      (slotsData || []).forEach((slot: TemplateSlot) => {
        const defaultPos = DEFAULT_POSITIONS[slot.slot_number - 1] || { top: 50, left: 50 };
        positions[slot.id] = {
          top: slot.position_top ?? defaultPos.top,
          left: slot.position_left ?? defaultPos.left,
        };
      });
      setTempPositions(positions);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [templateId]);

  // slots가 변경되면 tempPositions 업데이트 (게임방과 동일한 방식)
  useEffect(() => {
    if (slots.length === 0) return;

    const positions: Record<string, { top: number; left: number }> = {};
    slots.forEach((slot) => {
      const defaultPos = DEFAULT_POSITIONS[slot.slot_number - 1] || { top: 50, left: 50 };
      positions[slot.id] = {
        // ?? 사용: 0은 유효한 값이므로 null/undefined만 체크
        top: slot.position_top ?? defaultPos.top,
        left: slot.position_left ?? defaultPos.left,
      };
    });
    setTempPositions(positions);
  }, [slots]);

  // 드래그 여부 추적 (드래그 후 클릭 방지)
  const [wasDragging, setWasDragging] = useState(false);

  // 슬롯 클릭 핸들러 (드래그 후에는 모달 안 열림)
  const handleSlotClick = (slot: TemplateSlot) => {
    // 드래그 직후에는 클릭 무시
    if (wasDragging) {
      setWasDragging(false);
      return;
    }
    setSelectedSlot(slot);
    setShowSlotModal(true);
    setModalTab('sprite');
  };

  // 드래그 핸들러
  const handleMouseDown = (slot: TemplateSlot, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSlot(slot);
    setIsDragging(true);
    setWasDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedSlot || !containerRef.current) return;

    // 드래그 중임을 표시
    setWasDragging(true);

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setTempPositions((prev) => ({
      ...prev,
      [selectedSlot.id]: { top: clampedY, left: clampedX },
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 전체 저장
  const saveAllPositions = async () => {
    setIsSaving(true);

    try {
      for (const slot of slots) {
        const pos = tempPositions[slot.id];
        if (pos) {
          await supabase
            .from('template_slots')
            .update({
              position_top: Math.round(pos.top * 100) / 100,
              position_left: Math.round(pos.left * 100) / 100,
            })
            .eq('id', slot.id);
        }
      }
      alert('모든 위치가 저장되었습니다!');
      await fetchData();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 기본 위치로 초기화
  const resetToDefault = async () => {
    if (!confirm('모든 오너먼트를 기본 트리 배치로 초기화하시겠습니까?')) return;

    setIsSaving(true);

    try {
      const sortedSlots = [...slots].sort((a, b) => a.slot_number - b.slot_number);

      for (let i = 0; i < sortedSlots.length; i++) {
        const defaultPos = DEFAULT_POSITIONS[i] || { top: 50, left: 50 };
        await supabase
          .from('template_slots')
          .update({
            position_top: defaultPos.top,
            position_left: defaultPos.left,
          })
          .eq('id', sortedSlots[i].id);
      }

      alert('기본 위치로 초기화되었습니다!');
      await fetchData();
    } catch (error) {
      console.error('초기화 실패:', error);
      alert('초기화에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 기본 템플릿으로 설정
  const setAsDefault = async () => {
    if (!confirm('이 템플릿을 기본 템플릿으로 설정하시겠습니까?')) return;

    try {
      // 모든 템플릿의 is_default를 false로
      await supabase.from('templates').update({ is_default: false }).neq('id', templateId);

      // 현재 템플릿을 기본으로
      await supabase.from('templates').update({ is_default: true }).eq('id', templateId);

      alert('기본 템플릿으로 설정되었습니다!');
      await fetchData();
    } catch (error) {
      console.error('설정 실패:', error);
      alert('설정에 실패했습니다.');
    }
  };

  // 스프라이트 오프셋 저장 (트리 배치 위치도 함께 저장)
  const saveSpriteOffset = async (offsetX: number, offsetY: number) => {
    if (!selectedSlot) return;

    // 현재 드래그한 트리 배치 위치도 함께 저장
    const pos = tempPositions[selectedSlot.id];
    const updateData: Record<string, number> = {
      offset_x: offsetX,
      offset_y: offsetY,
    };

    // 트리 배치 위치가 있으면 함께 저장
    if (pos) {
      updateData.position_top = Math.round(pos.top * 100) / 100;
      updateData.position_left = Math.round(pos.left * 100) / 100;
    }

    await supabase
      .from('template_slots')
      .update(updateData)
      .eq('id', selectedSlot.id);

    await fetchData();
  };

  // 이미지 업로드 함수
  const uploadImage = async (file: File, type: 'background' | 'sprite') => {
    const isBackground = type === 'background';
    isBackground ? setIsUploadingBg(true) : setIsUploadingSprite(true);

    try {
      // 파일 확장자 추출
      const ext = file.name.split('.').pop();
      const fileName = `${templateId}/${type}_${Date.now()}.${ext}`;

      // 기존 이미지 삭제 (있으면)
      const currentImage = isBackground ? template?.background_image : template?.sprite_image;
      if (currentImage) {
        const oldPath = currentImage.split('/templates/')[1];
        if (oldPath) {
          await supabase.storage.from('templates').remove([oldPath]);
        }
      }

      // 새 이미지 업로드
      const { data, error } = await supabase.storage
        .from('templates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Public URL 가져오기
      const { data: urlData } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      // 템플릿 업데이트
      const updateData = isBackground
        ? { background_image: urlData.publicUrl }
        : { sprite_image: urlData.publicUrl };

      await supabase
        .from('templates')
        .update(updateData)
        .eq('id', templateId);

      await fetchData();
      alert(`${isBackground ? '배경' : '스프라이트'} 이미지가 업로드되었습니다!`);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      isBackground ? setIsUploadingBg(false) : setIsUploadingSprite(false);
    }
  };

  // 이미지 삭제 함수
  const deleteImage = async (type: 'background' | 'sprite') => {
    if (!confirm(`${type === 'background' ? '배경' : '스프라이트'} 이미지를 삭제하시겠습니까?`)) return;

    const isBackground = type === 'background';
    isBackground ? setIsUploadingBg(true) : setIsUploadingSprite(true);

    try {
      const currentImage = isBackground ? template?.background_image : template?.sprite_image;
      if (currentImage) {
        const oldPath = currentImage.split('/templates/')[1];
        if (oldPath) {
          await supabase.storage.from('templates').remove([oldPath]);
        }
      }

      // 템플릿 업데이트
      const updateData = isBackground
        ? { background_image: null }
        : { sprite_image: null };

      await supabase
        .from('templates')
        .update(updateData)
        .eq('id', templateId);

      await fetchData();
      alert('이미지가 삭제되었습니다!');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('이미지 삭제에 실패했습니다.');
    } finally {
      isBackground ? setIsUploadingBg(false) : setIsUploadingSprite(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'sprite') => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file, type);
    }
    e.target.value = ''; // 같은 파일 다시 선택 가능하도록
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">템플릿을 찾을 수 없습니다</p>
      </div>
    );
  }

  const sortedSlots = [...slots].sort((a, b) => a.slot_number - b.slot_number);

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            관리자로 돌아가기
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">{template.name}</h1>
                {template.description && (
                  <p className="text-sm text-gray-400">{template.description}</p>
                )}
              </div>
              {template.is_default && (
                <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-400">
                  기본
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {!template.is_default && (
                <button
                  onClick={setAsDefault}
                  className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-2 text-sm text-purple-400 hover:bg-purple-500/30"
                >
                  <Star className="h-4 w-4" />
                  기본으로 설정
                </button>
              )}
            </div>
          </div>
        </motion.header>

        {/* 이미지 설정 */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-xl bg-gray-800/50 p-4"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Image className="h-5 w-5" /> 테마 이미지 설정
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* 배경 이미지 (트리) */}
            <div className="rounded-lg bg-gray-900/50 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-300">배경 이미지 (트리)</h3>
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border-2 border-dashed border-gray-600 bg-gray-800">
                {template.background_image ? (
                  <>
                    <img
                      src={template.background_image}
                      alt="배경"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                      <button
                        onClick={() => bgInputRef.current?.click()}
                        disabled={isUploadingBg}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
                      >
                        {isUploadingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : '교체'}
                      </button>
                      <button
                        onClick={() => deleteImage('background')}
                        disabled={isUploadingBg}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    disabled={isUploadingBg}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 hover:text-white"
                  >
                    {isUploadingBg ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8" />
                        <span className="text-sm">이미지 업로드</span>
                        <span className="text-xs text-gray-500">기본: /tree.png</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'background')}
                className="hidden"
              />
              <p className="mt-2 text-xs text-gray-500">
                {template.background_image ? '업로드됨' : '미설정 (기본 트리 이미지 사용)'}
              </p>
            </div>

            {/* 스프라이트 이미지 (오너먼트) */}
            <div className="rounded-lg bg-gray-900/50 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-300">스프라이트 이미지 (오너먼트)</h3>
              <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-gray-600 bg-gray-800">
                {template.sprite_image ? (
                  <>
                    <img
                      src={template.sprite_image}
                      alt="스프라이트"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                      <button
                        onClick={() => spriteInputRef.current?.click()}
                        disabled={isUploadingSprite}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
                      >
                        {isUploadingSprite ? <Loader2 className="h-4 w-4 animate-spin" /> : '교체'}
                      </button>
                      <button
                        onClick={() => deleteImage('sprite')}
                        disabled={isUploadingSprite}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => spriteInputRef.current?.click()}
                    disabled={isUploadingSprite}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 hover:text-white"
                  >
                    {isUploadingSprite ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8" />
                        <span className="text-sm">이미지 업로드</span>
                        <span className="text-xs text-gray-500">기본: /selceted_ornament.png</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={spriteInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'sprite')}
                className="hidden"
              />
              <p className="mt-2 text-xs text-gray-500">
                {template.sprite_image ? '업로드됨' : '미설정 (기본 오너먼트 이미지 사용)'}
              </p>
            </div>
          </div>
        </motion.section>

        {/* 스프라이트 전역 설정 */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-xl bg-gray-800/50 p-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Sliders className="h-5 w-5" /> 스프라이트 전역 설정
            </h2>
            <button
              onClick={() => setShowSpriteSettings(!showSpriteSettings)}
              className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
            >
              {showSpriteSettings ? '접기' : '펼치기'}
            </button>
          </div>

          <AnimatePresence>
            {showSpriteSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 mb-4 flex items-center gap-4 rounded-lg bg-gray-900/50 p-4">
                  <div className="text-sm text-gray-400">미리보기:</div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 9, 10, 11].map((i) => {
                      const slot = slots.find(s => s.slot_number === i + 1);
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <Ornament
                            index={i}
                            size={48}
                            spriteConfig={spriteConfig}
                            spriteImageUrl={template.sprite_image || undefined}
                            individualOffset={slot ? { x: slot.offset_x, y: slot.offset_y } : undefined}
                          />
                          <span className="text-[10px] text-gray-500">#{i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">셀 너비 (px)</label>
                    <input
                      type="number"
                      value={spriteConfig.cellWidth}
                      onChange={(e) => setSpriteConfig({ ...spriteConfig, cellWidth: Number(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">셀 높이 (px)</label>
                    <input
                      type="number"
                      value={spriteConfig.cellHeight}
                      onChange={(e) => setSpriteConfig({ ...spriteConfig, cellHeight: Number(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">열 수</label>
                    <input
                      type="number"
                      value={spriteConfig.columns}
                      onChange={(e) => setSpriteConfig({ ...spriteConfig, columns: Number(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">행 수</label>
                    <input
                      type="number"
                      value={spriteConfig.rows}
                      onChange={(e) => setSpriteConfig({ ...spriteConfig, rows: Number(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">X 오프셋 (px)</label>
                    <input
                      type="number"
                      value={spriteConfig.offsetX}
                      onChange={(e) => setSpriteConfig({ ...spriteConfig, offsetX: Number(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Y 오프셋 (px)</label>
                    <input
                      type="number"
                      value={spriteConfig.offsetY}
                      onChange={(e) => setSpriteConfig({ ...spriteConfig, offsetY: Number(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">X 간격 (px)</label>
                    <input
                      type="number"
                      value={spriteConfig.gapX}
                      onChange={(e) => setSpriteConfig({ ...spriteConfig, gapX: Number(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Y 간격 (px)</label>
                    <input
                      type="number"
                      value={spriteConfig.gapY}
                      onChange={(e) => setSpriteConfig({ ...spriteConfig, gapY: Number(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                {spriteImageSize && (
                  <div className="mt-2 text-xs text-gray-500">
                    원본 이미지 크기: {spriteImageSize.width} x {spriteImageSize.height}px
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        // 이미지 크기가 있으면 함께 저장
                        const configToSave = {
                          ...spriteConfig,
                          imageWidth: spriteImageSize?.width || spriteConfig.imageWidth,
                          imageHeight: spriteImageSize?.height || spriteConfig.imageHeight,
                        };
                        await supabase
                          .from('templates')
                          .update({ sprite_config: configToSave })
                          .eq('id', templateId);
                        await fetchData();
                        alert('저장되었습니다.');
                      } catch (error) {
                        console.error('저장 실패:', error);
                        alert('저장에 실패했습니다.');
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500"
                  >
                    <Save className="h-4 w-4" />
                    저장
                  </button>
                  <button
                    onClick={() => setSpriteConfig(DEFAULT_SPRITE_CONFIG)}
                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500"
                  >
                    <RefreshCw className="h-4 w-4" />
                    기본값
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* 위치 에디터 */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-gray-800/50 p-4"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Settings className="h-5 w-5" />
            오너먼트 배치 설정
          </h2>

          {/* 안내 */}
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Move className="h-4 w-4" />
            <span>오너먼트를 드래그하여 위치를 조정하거나, 클릭하여 스프라이트 오프셋을 조정하세요.</span>
          </div>

          {/* 줌 컨트롤 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="rounded bg-gray-700 p-1 text-white hover:bg-gray-600"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-16 text-center text-xs text-gray-400">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="rounded bg-gray-700 p-1 text-white hover:bg-gray-600"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetToDefault}
                disabled={isSaving}
                className="flex items-center gap-1 rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-500 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                기본 배치
              </button>
              <button
                onClick={saveAllPositions}
                disabled={isSaving}
                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-500 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                전체 저장
              </button>
            </div>
          </div>

          {/* 트리 + 오너먼트 에디터 */}
          <div
            className="relative overflow-auto rounded-xl border border-gray-700 bg-gray-900"
            style={{ maxHeight: '500px' }}
          >
            <div
              ref={containerRef}
              className="relative"
              style={{
                width: `${imageDimensions.width * zoom}px`,
                height: `${imageDimensions.height * zoom}px`,
                margin: '0 auto',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* 트리 배경 */}
              <img
                src={template.background_image || '/tree.png'}
                alt="Tree"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
              />

              {/* 오너먼트들 */}
              {sortedSlots.map((slot) => {
                const pos = tempPositions[slot.id];
                if (!pos) return null;

                const isSelected = selectedSlot?.id === slot.id;

                return (
                  <motion.div
                    key={slot.id}
                    className={`absolute cursor-move ${isSelected ? 'z-50' : 'z-10'}`}
                    style={{
                      top: `${pos.top}%`,
                      left: `${pos.left}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onMouseDown={(e) => handleMouseDown(slot, e)}
                    onClick={() => handleSlotClick(slot)}
                    whileHover={{ scale: 1.2 }}
                  >
                    <div className={`relative ${isSelected ? 'rounded-full ring-2 ring-purple-400' : ''}`}>
                      <Ornament
                        index={slot.slot_number - 1}
                        size={24 * zoom}
                        spriteConfig={spriteConfig}
                        individualOffset={{ x: slot.offset_x, y: slot.offset_y }}
                        spriteImageUrl={template.sprite_image || undefined}
                      />
                      <span
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded bg-gray-600 px-1 text-white"
                        style={{ fontSize: `${8 * zoom}px` }}
                      >
                        {slot.slot_number}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 선택된 슬롯 정보 */}
          {selectedSlot && !showSlotModal && (
            <div className="mt-4 rounded-lg bg-gray-700 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">슬롯 #{selectedSlot.slot_number}</span>
                  <span className="ml-2 text-sm text-gray-400">
                    오프셋: ({selectedSlot.offset_x}, {selectedSlot.offset_y})
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  위치: ({tempPositions[selectedSlot.id]?.left.toFixed(1)}%,{' '}
                  {tempPositions[selectedSlot.id]?.top.toFixed(1)}%)
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleSlotClick(selectedSlot)}
                  className="rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-500"
                >
                  스프라이트 오프셋 조정
                </button>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-500"
                >
                  선택 해제
                </button>
              </div>
            </div>
          )}
        </motion.section>

        {/* 슬롯 목록 */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-xl bg-gray-800/50 p-4"
        >
          <h2 className="mb-4 text-lg font-bold text-white">슬롯 목록 ({slots.length}개) - 클릭하여 스프라이트 조정</h2>
          <div className="grid grid-cols-10 gap-2">
            {sortedSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                className={`rounded-lg p-2 text-center transition-all hover:bg-purple-600 ${
                  selectedSlot?.id === slot.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                <Ornament
                  index={slot.slot_number - 1}
                  size={28}
                  spriteConfig={spriteConfig}
                  individualOffset={{ x: slot.offset_x, y: slot.offset_y }}
                  spriteImageUrl={template.sprite_image || undefined}
                />
                <div className="mt-1 text-xs">{slot.slot_number}</div>
              </button>
            ))}
          </div>
        </motion.section>
      </div>

      {/* 슬롯 편집 모달 */}
      <AnimatePresence>
        {showSlotModal && selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowSlotModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-2xl bg-gray-800 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">#{selectedSlot.slot_number} 오너먼트</h3>
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 탭 */}
              <div className="mb-4 flex rounded-lg bg-gray-700 p-1">
                <button
                  onClick={() => setModalTab('sprite')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm transition-all ${
                    modalTab === 'sprite'
                      ? 'bg-purple-500 font-bold text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  스프라이트 오프셋
                </button>
                <button
                  onClick={() => setModalTab('position')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm transition-all ${
                    modalTab === 'position'
                      ? 'bg-purple-500 font-bold text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  배치 위치
                </button>
              </div>

              {modalTab === 'sprite' ? (
                <SpriteAdjuster
                  index={selectedSlot.slot_number - 1}
                  currentOffsetX={selectedSlot.offset_x}
                  currentOffsetY={selectedSlot.offset_y}
                  onSave={saveSpriteOffset}
                  onClose={() => setShowSlotModal(false)}
                  spriteImageUrl={template.sprite_image || undefined}
                  spriteConfig={spriteConfig}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Ornament
                      index={selectedSlot.slot_number - 1}
                      size={80}
                      spriteConfig={spriteConfig}
                      individualOffset={{ x: selectedSlot.offset_x, y: selectedSlot.offset_y }}
                      spriteImageUrl={template.sprite_image || undefined}
                    />
                  </div>
                  <div className="rounded-lg bg-gray-700 p-3">
                    <div className="text-sm text-gray-400">
                      현재 위치: ({tempPositions[selectedSlot.id]?.left.toFixed(1)}%,{' '}
                      {tempPositions[selectedSlot.id]?.top.toFixed(1)}%)
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      트리 에디터에서 드래그하여 위치를 조정하세요.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSlotModal(false)}
                    className="w-full rounded-lg bg-gray-700 py-2 text-white hover:bg-gray-600"
                  >
                    닫기
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

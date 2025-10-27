"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { ImageFile } from "@/types";
import { IconButton } from "@/components/ui/IconButton";

interface ImagePreviewProps {
  image: ImageFile | null;
  images: ImageFile[];
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}

export function ImagePreview({
  image,
  images,
  onClose,
  onNavigate,
}: ImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "actual">("contain");

  const currentIndex = image ? images.findIndex((img) => img.path === image.path) : -1;
  const isOpen = image !== null;

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setFitMode("contain");
    }
  }, [image?.path, isOpen]);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
    setRotation(0);
  }, []);

  // 切换适应模式
  const toggleFitMode = useCallback(() => {
    setFitMode((prev) => {
      if (prev === "contain") {
        // 从适应窗口切换到原始大小
        setScale(1);
        return "actual";
      } else {
        // 从原始大小切换回适应窗口
        setScale(1);
        return "contain";
      }
    });
  }, []);

  // 旋转控制
  const handleRotateLeft = useCallback(() => {
    setRotation((prev) => prev - 90);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation((prev) => prev + 90);
  }, []);

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [handleZoomIn, handleZoomOut]);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (currentIndex > 0) onNavigate("prev");
          break;
        case "ArrowRight":
          if (currentIndex < images.length - 1) onNavigate("next");
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          handleZoomReset();
          break;
        case "1":
          // 按1键切换适应模式
          toggleFitMode();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate, handleZoomIn, handleZoomOut, handleZoomReset, toggleFitMode]);

  if (!image) return null;

  // 根据 fitMode 设置样式
  const imageStyle: React.CSSProperties = {
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    transition: "transform 0.2s ease-out",
    ...(fitMode === "actual" 
      ? {
          // 原始大小：使用图片实际尺寸，不限制
          width: "auto",
          height: "auto",
        }
      : {
          // 适应窗口：限制最大尺寸，考虑到顶部和底部工具栏
          maxWidth: "calc(100vw - 2rem)",
          maxHeight: "calc(100vh - 12rem)",
          width: "100%",
          height: "100%",
          objectFit: 'contain',
        }
    ),
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm cursor-pointer" 
          onClick={onClose}
        />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onWheel={handleWheel}
          onPointerDownOutside={(e) => {
            // 点击内容外部区域时关闭
            onClose();
          }}
        >
          {/* 顶部工具栏 */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent z-10">
            <div className="flex items-center gap-4">
              <Dialog.Title className="text-white font-medium">
                {image.name}
              </Dialog.Title>
              <span className="text-white/70 text-sm">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
            <Dialog.Close asChild>
              <IconButton
                icon={<Cross2Icon />}
                onClick={onClose}
                className="text-white hover:bg-white/20"
              />
            </Dialog.Close>
          </div>

          {/* 图片容器 */}
          <div 
            className="relative w-full h-full flex items-center justify-center overflow-auto"
            onClick={(e) => {
              // 点击图片容器空白区域关闭
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            <img
              src={image.url}
              alt={image.name}
              style={imageStyle}
              className="pointer-events-none"
            />
          </div>

          {/* 底部控制栏 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent z-10">
            <div className="flex items-center justify-center gap-2">
              {/* 导航按钮 */}
              <IconButton
                icon={<span>←</span>}
                onClick={() => onNavigate("prev")}
                disabled={currentIndex === 0}
                className="text-white hover:bg-white/20 disabled:opacity-30"
              />

              {/* 旋转按钮 */}
              <IconButton
                icon={<span>↺</span>}
                onClick={handleRotateLeft}
                className="text-white hover:bg-white/20"
                title="向左旋转"
              />
              <IconButton
                icon={<span>↻</span>}
                onClick={handleRotateRight}
                className="text-white hover:bg-white/20"
                title="向右旋转"
              />

              {/* 缩放按钮 */}
              <div className="h-6 w-px bg-white/30 mx-2" />
              <IconButton
                icon={<span>-</span>}
                onClick={handleZoomOut}
                disabled={scale <= 0.25}
                className="text-white hover:bg-white/20 disabled:opacity-30"
                title="缩小"
              />
              <span className="text-white text-sm min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <IconButton
                icon={<span>+</span>}
                onClick={handleZoomIn}
                disabled={scale >= 5}
                className="text-white hover:bg-white/20 disabled:opacity-30"
                title="放大"
              />
              <IconButton
                icon={<span>⊡</span>}
                onClick={handleZoomReset}
                className="text-white hover:bg-white/20"
                title="重置"
              />

              {/* 适应模式切换按钮 */}
              <div className="h-6 w-px bg-white/30 mx-2" />
              <IconButton
                icon={<span className="text-xs">{fitMode === "contain" ? "1:1" : "⊞"}</span>}
                onClick={() => {
                  console.log("切换前 fitMode:", fitMode);
                  toggleFitMode();
                }}
                className={`text-white hover:bg-white/20 ${
                  fitMode === "actual" ? "bg-white/20" : ""
                }`}
                title={fitMode === "contain" ? "切换到原始大小 (1)" : "切换到适应窗口 (1)"}
              />
              <span className="text-white/60 text-xs ml-1">
                {fitMode === "contain" ? "适应" : "原始"}
              </span>

              {/* 导航按钮 */}
              <div className="h-6 w-px bg-white/30 mx-2" />
              <IconButton
                icon={<span>→</span>}
                onClick={() => onNavigate("next")}
                disabled={currentIndex === images.length - 1}
                className="text-white hover:bg-white/20 disabled:opacity-30"
              />
            </div>

            {/* 图片信息 */}
            <div className="mt-3 text-center text-white/70 text-sm">
              {image.width && image.height && (
                <span>
                  {image.width} × {image.height} px
                </span>
              )}
              {image.size && (
                <span className="ml-4">
                  {(image.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
              {image.modifiedAt && (
                <span className="ml-4">
                  {new Date(image.modifiedAt).toLocaleDateString("zh-CN")}
                </span>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

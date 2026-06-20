import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * MermaidFullscreenModal 组件的属性
 */
interface MermaidFullscreenModalProps {
  /** 是否显示模态框 */
  open: boolean;
  /** 模态框显示状态变更回调 */
  onOpenChange: (open: boolean) => void;
  /** 渲染后的 SVG HTML 字符串 */
  svgHtml: string;
}

/**
 * 视图状态：缩放比例和偏移量
 */
interface ViewState {
  /** 缩放比例 (0.1 ~ 5) */
  scale: number;
  /** X 轴偏移量 */
  offsetX: number;
  /** Y 轴偏移量 */
  offsetY: number;
}

/** 最小缩放比例 */
const MIN_SCALE = 0.1;
/** 最大缩放比例 */
const MAX_SCALE = 5;
/** 缩放步长 */
const SCALE_STEP = 0.1;

/**
 * Mermaid 图全屏查看模态框
 *
 * 支持鼠标滚轮缩放、左键拖拽平移，提供缩放按钮和重置功能。
 * 使用项目现有的 shadcn/ui Dialog 组件，UI 风格与项目保持一致。
 *
 * @param props - 组件属性
 * @returns 全屏模态框组件
 */
export function MermaidFullscreenModal({
  open,
  onOpenChange,
  svgHtml,
}: MermaidFullscreenModalProps) {
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewStateRef = useRef(viewState);
  useEffect(() => { viewStateRef.current = viewState; }, [viewState]);

  // 模态框关闭时重置状态
  useEffect(() => {
    if (!open) {
      setViewState({ scale: 1, offsetX: 0, offsetY: 0 });
      setIsDragging(false);
    }
  }, [open]);

  /**
   * 处理鼠标滚轮缩放
   * 以鼠标位置为中心进行缩放
   * 使用原生事件监听以支持 preventDefault
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !open) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      // 鼠标相对于容器的位置
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setViewState((prev) => {
        // 计算新的缩放比例
        const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta));

        // 计算缩放中心偏移，保持鼠标位置不变
        const scaleRatio = newScale / prev.scale;
        const newOffsetX = mouseX - (mouseX - prev.offsetX) * scaleRatio;
        const newOffsetY = mouseY - (mouseY - prev.offsetY) * scaleRatio;

        return { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [open]);

  /**
   * 处理鼠标按下事件 - 开始拖拽
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // 仅响应左键

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: viewStateRef.current.offsetX,
      offsetY: viewStateRef.current.offsetY,
    };
  }, []);

  // 拖拽时在 document 上监听鼠标事件，确保鼠标移出容器后拖拽仍有效
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMoveDoc = (e: MouseEvent) => {
      const dragStart = dragStartRef.current;
      if (!dragStart) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setViewState((prev) => ({
        ...prev,
        offsetX: dragStart.offsetX + dx,
        offsetY: dragStart.offsetY + dy,
      }));
    };

    const handleMouseUpDoc = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMoveDoc);
    document.addEventListener('mouseup', handleMouseUpDoc);
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveDoc);
      document.removeEventListener('mouseup', handleMouseUpDoc);
    };
  }, [isDragging]);

  /**
   * 放大
   */
  const handleZoomIn = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale + SCALE_STEP),
    }));
  }, []);

  /**
   * 缩小
   */
  const handleZoomOut = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale - SCALE_STEP),
    }));
  }, []);

  /**
   * 重置视图到初始状态
   */
  const handleReset = useCallback(() => {
    setViewState({ scale: 1, offsetX: 0, offsetY: 0 });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/80" />
        <DialogContent
          className="sm:max-w-none w-screen h-screen max-w-none p-0 gap-0 border-none"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Mermaid 图全屏查看</DialogTitle>
          {/* 工具栏 */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <span className="text-sm text-muted-foreground">
              {Math.round(viewState.scale * 100)}%
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                title="缩小"
              >
                <ZoomOut className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                title="放大"
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="重置"
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                title="关闭"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* 画布区域 */}
          <div
            ref={containerRef}
            className="w-full h-full overflow-hidden pt-12"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
                transformOrigin: "0 0",
              }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

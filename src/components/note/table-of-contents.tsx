import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToc } from '@/components/context/toc-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { List, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

/**
 * 目录浮动面板组件属性
 */
interface TableOfContentsProps {
  /** 目录面板的最大显示深度，默认 3（显示 h1-h3） */
  maxDepth?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否以侧边栏内联形式展示，默认 false */
  isInline?: boolean;
}

/**
 * 目录浮动面板组件
 * 在页面右下角显示一个可展开的目录导航面板
 *
 * 功能：
 * - 常驻浮动按钮，点击展开/收起
 * - 显示文档标题的层级结构
 * - 点击标题平滑滚动到对应位置
 * - 滚动时自动高亮当前可见的标题
 *
 * @param props - 组件属性
 * @returns 目录面板组件
 *
 * @example
 * ```tsx
 * <TocProvider>
 *   <MarkdownEditor value={content} />
 *   <TableOfContents maxDepth={3} />
 * </TocProvider>
 * ```
 */
export const TableOfContents: React.FC<TableOfContentsProps> = ({
  maxDepth = 3,
  className,
  isInline = false,
}) => {
  const { t } = useTranslation();
  const { headings, activeId, setActiveId } = useToc();
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [rootEl, setRootEl] = useState<Element | null>(null);

  // 动态查找预览滚动容器，应对 Suspense 懒加载/延迟挂载的问题
  // Dynamically find the preview scroll container to handle Suspense lazy loading/delayed mounting
  useEffect(() => {
    const checkEl = () => {
      const el = document.querySelector('.markdown-preview') as HTMLElement | null;
      if (el) {
        // 1. 检查预览区域本身是否具有可滚动的样式与高度溢出
        // 1. Check if the preview area itself has scrollable styles and height overflow
        const style = window.getComputedStyle(el);
        const isSelfScrollable = el.scrollHeight > el.clientHeight && 
          (style.overflowY === 'auto' || style.overflowY === 'scroll');
          
        if (isSelfScrollable) {
          setRootEl(el);
          return true;
        }

        // 2. 如果预览区不可滚动，向上冒泡寻找真正发生滚动的父容器，优先匹配 main 元素
        // 2. If preview is not scrollable, bubble up to find the container that actually scrolls, prioritizing the main element
        let parent = el.parentElement;
        while (parent) {
          if (parent.tagName === 'MAIN') {
            setRootEl(parent);
            return true;
          }
          const parentStyle = window.getComputedStyle(parent);
          const isParentScrollable = parent.scrollHeight > parent.clientHeight &&
            (parentStyle.overflowY === 'auto' || parentStyle.overflowY === 'scroll');
            
          if (isParentScrollable) {
            setRootEl(parent);
            return true;
          }
          parent = parent.parentElement;
        }

        // 3. 兜底回退：如果存在全局 main 元素则以其为准，否则回退为 null（使用 Viewport）
        // 3. Fallback: use main element if exists, otherwise fallback to null (using Viewport)
        const mainEl = document.querySelector('main');
        if (mainEl) {
          setRootEl(mainEl);
          return true;
        }

        setRootEl(null);
        return true;
      }
      return false;
    };

    if (checkEl()) return;

    const timer = setInterval(() => {
      if (checkEl()) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [headings]);

  // 当激活标题改变时，自动将对应的内联大纲项滚动到可见区域
  // Automatically scroll the corresponding inline outline item into view when active heading changes
  useEffect(() => {
    // 如果是由点击目录项触发的程序化滚动，则不执行大纲的自动滚动对齐，避免两者并发产生滚动冲突
    // Skip auto scrolling alignment if triggered by programmatic click scroll to avoid conflict
    if (!isInline || !activeId || !listContainerRef.current || isProgrammaticScrollRef.current) return;

    try {
      const activeLink = listContainerRef.current.querySelector(
        `a[href="#${CSS.escape(activeId)}"]`
      ) as HTMLElement | null;

      if (activeLink && listContainerRef.current) {
        const container = listContainerRef.current;
        const containerHeight = container.clientHeight;
        const elemTop = activeLink.offsetTop;
        const elemHeight = activeLink.offsetHeight;

        // 计算当前大纲高亮项在局部容器居中时所需的容器内部相对 scrollTop，避免拉扯外层 main 滚动条
        // Calculate container internal relative scrollTop to center active item without shifting global main scrollbar
        const targetScrollTop = elemTop - containerHeight / 2 + elemHeight / 2;

        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    } catch (e) {
      console.warn('Failed to scroll active toc item into view:', e);
    }
  }, [activeId, isInline]);

  // 过滤超出深度的标题
  // Filter headings exceeding the maximum depth
  const filteredHeadings = useMemo(() => {
    return headings.filter(h => h.level <= maxDepth);
  }, [headings, maxDepth]);

  /**
   * 滚动到指定标题位置
   * 使用 smooth 行为实现平滑滚动
   * Scroll to the specified heading position using smooth behavior
   */
  const scrollToHeading = useCallback((id: string) => {
    const element = headings.find(h => h.id === id)?.element || document.getElementById(id);
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [headings]);

  // 设置 IntersectionObserver 监听标题可见性
  // Set up IntersectionObserver to watch heading visibility
  useEffect(() => {
    // 清理旧的 observer
    // Clean up the old observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 没有标题时不创建 observer
    // Do not create observer if there are no headings
    if (filteredHeadings.length === 0) return;

    // 记录当前可见的标题
    // Record currently visible headings
    const visibleHeadings = new Set<string>();

    // 创建新的 observer
    // Create a new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;

        // 更新可见状态
        // Update visibility status
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target.id);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        });

        // 如果有可见的标题，选中在文档中最靠前的一个
        // If there are visible headings, select the first one in the document
        if (visibleHeadings.size > 0) {
          const firstVisible = filteredHeadings.find(h => visibleHeadings.has(h.id));
          if (firstVisible) {
            setActiveId(firstVisible.id);
          }
        }
      },
      {
        root: rootEl,
        // 视口偏移：顶部 0px，底部缩小 60%
        // 这意味着交叉区域为视口的顶部 40%
        // 只有当标题进入这个区域时，才被认为是"当前阅读"的章节
        // Viewport offset: top 0px, bottom shrunk by 60%. This makes the intersection area the top 40%.
        rootMargin: '0px 0px -60% 0px',
      }
    );

    // 绑定所有标题元素
    // Bind all heading elements
    filteredHeadings.forEach(heading => {
      if (heading.element) {
        observerRef.current?.observe(heading.element);
      }
    });

    // 组件卸载时清理
    // Clean up when the component unmounts
    return () => {
      observerRef.current?.disconnect();
    };
  }, [filteredHeadings, setActiveId, rootEl]);

  // 切换面板展开/收起
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // 点击目录项
  const handleItemClick = useCallback((id: string) => {
    isProgrammaticScrollRef.current = true;
    setActiveId(id);
    scrollToHeading(id);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    // 假设平滑滚动最多耗时 1000ms
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 1000);
  }, [scrollToHeading, setActiveId]);

  if (isInline) {
    return (
      <nav
        className={cn(
          "w-60 shrink-0 border border-border bg-card rounded-xl flex flex-col h-fit max-h-[calc(100vh-120px)] sticky top-4 overflow-hidden",
          className
        )}
        aria-label={t("ui.toc.label", "文档目录")}
      >
        {/* 标题栏 */}
        <div className="sticky top-0 border-b bg-card px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-sm font-semibold">{t("ui.toc.title", "目录")}</h3>
        </div>

        {/* 目录列表 */}
        <div ref={listContainerRef} className="p-2 flex-1 overflow-y-auto min-h-0">
          {filteredHeadings.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              {t("ui.toc.empty", "无目录")}
            </p>
          ) : (
            <ol role="list" className="space-y-1">
              {filteredHeadings.map(heading => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleItemClick(heading.id);
                    }}
                    className={cn(
                      "block rounded-r-md border-l-2 border-transparent px-2 py-1.5 text-sm transition-all duration-200",
                      activeId === heading.id
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    style={{
                      paddingLeft: `${(heading.level - 1) * 12 + 8}px`,
                    }}
                    aria-current={activeId === heading.id ? "location" : undefined}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      </nav>
    );
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* 浮动触发按钮 */}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={toggleOpen}
        aria-label={isOpen ? t("ui.toc.close", "关闭目录") : t("ui.toc.open", "打开目录")}
      >
        {isOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
      </Button>

      {/* 目录面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-72 max-h-96 overflow-auto rounded-lg border bg-card shadow-xl"
            aria-label={t("ui.toc.label", "文档目录")}
          >
            {/* 标题栏 */}
            <div className="sticky top-0 border-b bg-card px-4 py-3">
              <h3 className="text-sm font-semibold">{t("ui.toc.title", "目录")}</h3>
            </div>

            {/* 目录列表 */}
            <div className="p-2">
              {filteredHeadings.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t("ui.toc.empty", "无目录")}
                </p>
              ) : (
                <ol role="list" className="space-y-1">
                  {filteredHeadings.map(heading => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleItemClick(heading.id);
                        }}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                          activeId === heading.id
                            ? "bg-accent font-medium text-accent-foreground"
                            : "text-muted-foreground"
                        )}
                        style={{
                          paddingLeft: `${(heading.level - 1) * 12 + 8}px`,
                        }}
                        aria-current={activeId === heading.id ? "location" : undefined}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

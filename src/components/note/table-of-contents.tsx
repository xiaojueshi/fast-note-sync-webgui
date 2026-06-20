import React, { useCallback, useEffect, useRef, useState } from 'react';
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
}) => {
  const { t } = useTranslation();
  const { headings, activeId, setActiveId } = useToc();
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 过滤超出深度的标题
  const filteredHeadings = headings.filter(h => h.level <= maxDepth);

  /**
   * 滚动到指定标题位置
   * 使用 smooth 行为实现平滑滚动
   */
  const scrollToHeading = useCallback((id: string) => {
    const element = headings.find(h => h.id === id)?.element || document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [headings]);

  // 设置 IntersectionObserver 监听标题可见性
  useEffect(() => {
    // 清理旧的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 没有标题时不创建 observer
    if (filteredHeadings.length === 0) return;

    // 记录当前可见的标题
    const visibleHeadings = new Set<string>();

    // 创建新的 observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;

        // 更新可见状态
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target.id);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        });

        // 如果有可见的标题，选中在文档中最靠前的一个
        if (visibleHeadings.size > 0) {
          const firstVisible = filteredHeadings.find(h => visibleHeadings.has(h.id));
          if (firstVisible) {
            setActiveId(firstVisible.id);
          }
        }
      },
      {
        // 视口偏移：顶部 0px，底部缩小 60%
        // 这意味着交叉区域为视口的顶部 40%
        // 只有当标题进入这个区域时，才被认为是"当前阅读"的章节
        rootMargin: '0px 0px -60% 0px',
      }
    );

    // 绑定所有标题元素
    filteredHeadings.forEach(heading => {
      if (heading.element) {
        observerRef.current?.observe(heading.element);
      }
    });

    // 组件卸载时清理
    return () => {
      observerRef.current?.disconnect();
    };
  }, [filteredHeadings, setActiveId]);

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

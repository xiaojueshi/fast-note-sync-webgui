import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

/**
 * 目录项数据结构
 * 表示文档中的一个标题及其元信息
 */
export interface TocItem {
  /** 标题的唯一标识符（自动生成或从 id 属性获取） */
  id: string;
  /** 标题层级：1-6，对应 h1-h6 */
  level: number;
  /** 标题的纯文本内容（去除 Markdown 格式） */
  text: string;
  /** 标题对应的 DOM 元素引用，用于滚动定位 */
  element: HTMLElement;
}

/**
 * 目录 Context 类型定义
 * 提供标题数据管理和当前激活状态
 */
export interface TocContextType {
  /** 当前文档的所有标题列表 */
  headings: TocItem[];
  /** 当前在视口中可见的标题 ID */
  activeId: string | null;
  /** 注册一个新的标题到目录 */
  registerHeading: (item: TocItem) => void;
  /** 从目录注销一个标题 */
  unregisterHeading: (id: string) => void;
  /** 设置当前激活的标题 ID */
  setActiveId: (id: string) => void;
}

const TocContext = createContext<TocContextType | undefined>(undefined);

/**
 * 目录数据 Context Provider
 * 包裹需要目录功能的组件树，提供标题数据管理
 *
 * @param children - 子组件
 *
 * @example
 * ```tsx
 * <TocProvider>
 *   <MarkdownEditor />
 *   <TableOfContents />
 * </TocProvider>
 * ```
 */
export const TocProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 使用 ref 存储原始数据，避免不必要的重渲染
  const headingsRef = useRef<TocItem[]>([]);
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * 注册一个新的标题到目录
   * 如果相同 id 已存在，则忽略重复注册
   */
  const registerHeading = useCallback((item: TocItem) => {
    const existing = headingsRef.current.find(h => h.id === item.id);
    if (!existing) {
      headingsRef.current = [...headingsRef.current, item];
      setHeadings([...headingsRef.current]);
    }
  }, []);

  /**
   * 从目录注销一个标题
   * 按 id 查找并移除
   */
  const unregisterHeading = useCallback((id: string) => {
    headingsRef.current = headingsRef.current.filter(h => h.id !== id);
    setHeadings([...headingsRef.current]);
  }, []);

  return (
    <TocContext.Provider value={{ headings, activeId, registerHeading, unregisterHeading, setActiveId }}>
      {children}
    </TocContext.Provider>
  );
};

/**
 * 目录数据消费 hook
 * 必须在 TocProvider 内部使用
 *
 * @returns TocContextType - 目录数据和操作方法
 * @throws 如果未包裹 TocProvider 则抛出错误
 */
export const useToc = (): TocContextType => {
  const context = useContext(TocContext);
  if (!context) {
    throw new Error('useToc must be used within a TocProvider');
  }
  return context;
};

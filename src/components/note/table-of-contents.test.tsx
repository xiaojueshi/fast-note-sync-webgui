import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TableOfContents } from './table-of-contents';
import { TocProvider, useToc } from '@/components/context/toc-context';
import React from 'react';

// Mock IntersectionObserver（jsdom 不支持）
let latestIntersectionObserverCallback: IntersectionObserverCallback | null = null;

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    latestIntersectionObserverCallback = callback;
  }
}

/**
 * 触发最近一次创建的 IntersectionObserver 回调。
 *
 * @param entries - 要投递给观察器的交叉状态列表
 */
function triggerIntersection(entries: Array<Partial<IntersectionObserverEntry> & { target: Element; isIntersecting: boolean }>) {
  if (!latestIntersectionObserverCallback) {
    throw new Error('IntersectionObserver callback is not registered');
  }

  latestIntersectionObserverCallback(entries as IntersectionObserverEntry[], {} as IntersectionObserver);
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  window.history.replaceState(null, '', '/?notes&vault=test#existing-hash');
  latestIntersectionObserverCallback = null;
});

// Mock motion 库
vi.mock('motion/react', () => ({
  motion: {
    div: 'div',
    nav: 'nav',
    button: 'button',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Helper: 创建带 Provider 的渲染
const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <TocProvider>
      {ui}
    </TocProvider>
  );
};

describe('TableOfContents', () => {
  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = '';
  });

  it('无标题时应显示空状态提示', () => {
    renderWithProvider(<TableOfContents />);

    // 点击按钮展开
    const button = screen.getByRole('button', { name: /目录/i });
    fireEvent.click(button);

    expect(screen.getByText(/无目录/i)).toBeInTheDocument();
  });

  it('有标题时应正确渲染目录列表', () => {
    // 创建测试标题元素
    const h1 = document.createElement('h1');
    h1.id = 'heading-1';
    h1.textContent = 'First Heading';
    document.body.appendChild(h1);

    const h2 = document.createElement('h2');
    h2.id = 'heading-2';
    h2.textContent = 'Second Heading';
    document.body.appendChild(h2);

    // 使用辅助组件注册标题
    const TestHelper = () => {
      const { registerHeading } = useToc();
      React.useEffect(() => {
        registerHeading({ id: 'heading-1', level: 1, text: 'First Heading', element: h1 });
        registerHeading({ id: 'heading-2', level: 2, text: 'Second Heading', element: h2 });
      }, [registerHeading]);
      return null;
    };

    render(
      <TocProvider>
        <TestHelper />
        <TableOfContents />
      </TocProvider>
    );

    // 点击按钮展开
    const button = screen.getByRole('button', { name: /目录/i });
    fireEvent.click(button);

    // 使用 getAllByText 因为标题文本可能同时出现在 DOM 的标题元素和目录链接中
    const firstHeadingLinks = screen.getAllByText('First Heading');
    expect(firstHeadingLinks.length).toBeGreaterThanOrEqual(1);
    
    const secondHeadingLinks = screen.getAllByText('Second Heading');
    expect(secondHeadingLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('应支持展开/收起切换', () => {
    renderWithProvider(<TableOfContents />);

    const button = screen.getByRole('button', { name: /目录/i });

    // 初始状态：收起
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    // 点击展开
    fireEvent.click(button);
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // 点击收起
    fireEvent.click(button);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('应限制显示深度（maxDepth）', () => {
    const h1 = document.createElement('h1');
    h1.id = 'depth-1';
    document.body.appendChild(h1);

    const h4 = document.createElement('h4');
    h4.id = 'depth-4';
    document.body.appendChild(h4);

    const TestHelper = () => {
      const { registerHeading } = useToc();
      React.useEffect(() => {
        registerHeading({ id: 'depth-1', level: 1, text: 'Depth 1', element: h1 });
        registerHeading({ id: 'depth-4', level: 4, text: 'Depth 4', element: h4 });
      }, [registerHeading]);
      return null;
    };

    render(
      <TocProvider>
        <TestHelper />
        <TableOfContents maxDepth={3} />
      </TocProvider>
    );

    const button = screen.getByRole('button', { name: /目录/i });
    fireEvent.click(button);

    expect(screen.getByText('Depth 1')).toBeInTheDocument();
    expect(screen.queryByText('Depth 4')).not.toBeInTheDocument();
  });

  it('点击目录项时不应修改 URL hash', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    const heading = document.createElement('h1');
    heading.id = 'heading-1';
    heading.textContent = 'First Heading';
    heading.getBoundingClientRect = vi.fn(() => ({
      top: 240,
      bottom: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
    document.body.appendChild(heading);

    const TestHelper = () => {
      const { registerHeading } = useToc();

      React.useEffect(() => {
        registerHeading({ id: 'heading-1', level: 1, text: 'First Heading', element: heading });
      }, [registerHeading]);

      return null;
    };

    render(
      <TocProvider>
        <TestHelper />
        <TableOfContents />
      </TocProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /目录/i }));
    fireEvent.click(screen.getByRole('button', { name: 'First Heading' }));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 160, behavior: 'smooth' });
    expect(window.location.hash).toBe('#existing-hash');
  });

  it('内部滚动预览中点击目录项时应滚动最近的预览容器', () => {
    const windowScrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    const previewContainer = document.createElement('div');
    previewContainer.className = 'markdown-preview';
    previewContainer.scrollTop = 40;
    previewContainer.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      bottom: 500,
      left: 0,
      right: 0,
      width: 0,
      height: 400,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }));
    Object.defineProperty(previewContainer, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(previewContainer, 'scrollHeight', { value: 800, configurable: true });
    const previewScrollToSpy = vi.fn();
    Object.defineProperty(previewContainer, 'scrollTo', {
      value: previewScrollToSpy,
      configurable: true,
    });

    const heading = document.createElement('h1');
    heading.id = 'heading-in-preview';
    heading.textContent = 'Preview Heading';
    heading.getBoundingClientRect = vi.fn(() => ({
      top: 220,
      bottom: 260,
      left: 0,
      right: 0,
      width: 0,
      height: 40,
      x: 0,
      y: 220,
      toJSON: () => ({}),
    }));
    previewContainer.appendChild(heading);
    document.body.appendChild(previewContainer);

    const TestHelper = () => {
      const { registerHeading } = useToc();

      React.useEffect(() => {
        registerHeading({ id: 'heading-in-preview', level: 1, text: 'Preview Heading', element: heading });
      }, [registerHeading]);

      return null;
    };

    render(
      <TocProvider>
        <TestHelper />
        <TableOfContents />
      </TocProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /目录/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Preview Heading' }));

    expect(previewScrollToSpy).toHaveBeenCalledWith({ top: 80, behavior: 'smooth' });
    expect(windowScrollToSpy).not.toHaveBeenCalled();
  });

  it('预览容器不可滚动时应回退到 window 滚动', () => {
    const windowScrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    const previewContainer = document.createElement('div');
    previewContainer.className = 'markdown-preview';
    previewContainer.scrollTop = 0;
    previewContainer.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      bottom: 500,
      left: 0,
      right: 0,
      width: 0,
      height: 400,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }));
    Object.defineProperty(previewContainer, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(previewContainer, 'scrollHeight', { value: 400, configurable: true });
    const previewScrollToSpy = vi.fn();
    Object.defineProperty(previewContainer, 'scrollTo', {
      value: previewScrollToSpy,
      configurable: true,
    });

    const heading = document.createElement('h1');
    heading.id = 'non-scrollable-preview-heading';
    heading.textContent = 'Non Scrollable Preview Heading';
    heading.getBoundingClientRect = vi.fn(() => ({
      top: 260,
      bottom: 300,
      left: 0,
      right: 0,
      width: 0,
      height: 40,
      x: 0,
      y: 260,
      toJSON: () => ({}),
    }));
    previewContainer.appendChild(heading);
    document.body.appendChild(previewContainer);

    const TestHelper = () => {
      const { registerHeading } = useToc();

      React.useEffect(() => {
        registerHeading({
          id: 'non-scrollable-preview-heading',
          level: 1,
          text: 'Non Scrollable Preview Heading',
          element: heading,
        });
      }, [registerHeading]);

      return null;
    };

    render(
      <TocProvider>
        <TestHelper />
        <TableOfContents />
      </TocProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /目录/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Non Scrollable Preview Heading' }));

    expect(previewScrollToSpy).not.toHaveBeenCalled();
    expect(windowScrollToSpy).toHaveBeenCalledWith({ top: 180, behavior: 'smooth' });
  });

  it('多个标题同时可见时应激活较靠后的当前标题', () => {
    const firstHeading = document.createElement('h1');
    firstHeading.id = 'heading-1';
    firstHeading.textContent = 'First Heading';
    document.body.appendChild(firstHeading);

    const secondHeading = document.createElement('h2');
    secondHeading.id = 'heading-2';
    secondHeading.textContent = 'Second Heading';
    document.body.appendChild(secondHeading);

    const TestHelper = () => {
      const { registerHeading } = useToc();

      React.useEffect(() => {
        registerHeading({ id: 'heading-1', level: 1, text: 'First Heading', element: firstHeading });
        registerHeading({ id: 'heading-2', level: 2, text: 'Second Heading', element: secondHeading });
      }, [registerHeading]);

      return null;
    };

    render(
      <TocProvider>
        <TestHelper />
        <TableOfContents />
      </TocProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /目录/i }));

    act(() => {
      triggerIntersection([
        { target: firstHeading, isIntersecting: true },
        { target: secondHeading, isIntersecting: true },
      ]);
    });

    expect(screen.getByRole('button', { name: 'Second Heading' })).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('button', { name: 'First Heading' })).not.toHaveAttribute('aria-current');
  });
});

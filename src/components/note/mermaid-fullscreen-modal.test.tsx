import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { MermaidFullscreenModal } from "./mermaid-fullscreen-modal";

interface MockDialogProps {
  children: ReactNode;
  open?: boolean;
}

interface MockDialogPortalProps {
  children: ReactNode;
}

interface MockDialogOverlayProps {
  className?: string;
}

interface MockDialogContentProps {
  children: ReactNode;
  className?: string;
}

interface MockButtonProps {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  [key: string]: unknown;
}

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: MockDialogProps) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogPortal: ({ children }: MockDialogPortalProps) => <div>{children}</div>,
  DialogOverlay: ({ className }: MockDialogOverlayProps) => <div data-testid="overlay" className={className} />,
  DialogContent: ({ children, className }: MockDialogContentProps) => (
    <div data-testid="content" className={className}>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, title, ...props }: MockButtonProps) => (
    <button onClick={onClick} title={title} {...props}>{children}</button>
  ),
}));

describe("MermaidFullscreenModal", () => {
  const mockSvgHtml = '<svg width="100" height="100"><rect width="100" height="100" fill="red"/></svg>';

  it("渲染模态框内容", () => {
    render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("显示初始缩放比例 100%", () => {
    render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("点击放大按钮增加缩放比例", () => {
    render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    const zoomInButton = screen.getByTitle("放大");
    fireEvent.click(zoomInButton);

    expect(screen.getByText("110%")).toBeInTheDocument();
  });

  it("点击缩小按钮减少缩放比例", () => {
    render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    const zoomOutButton = screen.getByTitle("缩小");
    fireEvent.click(zoomOutButton);

    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("点击重置按钮恢复初始状态", () => {
    render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    const zoomInButton = screen.getByTitle("放大");
    fireEvent.click(zoomInButton);
    expect(screen.getByText("110%")).toBeInTheDocument();

    const resetButton = screen.getByTitle("重置");
    fireEvent.click(resetButton);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("点击关闭按钮调用 onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={onOpenChange}
        svgHtml={mockSvgHtml}
      />
    );

    const closeButton = screen.getByTitle("关闭");
    fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("缩放比例不超过最大值", () => {
    render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    const zoomInButton = screen.getByTitle("放大");

    for (let i = 0; i < 40; i++) {
      fireEvent.click(zoomInButton);
    }

    expect(screen.getByText("500%")).toBeInTheDocument();

    fireEvent.click(zoomInButton);
    expect(screen.getByText("500%")).toBeInTheDocument();
  });

  it("缩放比例不超过最小值", () => {
    render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    const zoomOutButton = screen.getByTitle("缩小");

    for (let i = 0; i < 9; i++) {
      fireEvent.click(zoomOutButton);
    }

    expect(screen.getByText("10%")).toBeInTheDocument();

    fireEvent.click(zoomOutButton);
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("关闭后重新打开时状态重置", () => {
    const { rerender } = render(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    const zoomInButton = screen.getByTitle("放大");
    fireEvent.click(zoomInButton);
    expect(screen.getByText("110%")).toBeInTheDocument();

    rerender(
      <MermaidFullscreenModal
        open={false}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    rerender(
      <MermaidFullscreenModal
        open={true}
        onOpenChange={vi.fn()}
        svgHtml={mockSvgHtml}
      />
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});

import { useState, useRef, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";

/**
 * Shared tooltip logic for dropdown trigger buttons.
 * Returns a ref to attach to the trigger, mouse event handlers,
 * and a portal-ready tooltip JSX element.
 */
export function useDropdownTooltip(tooltipText: string) {
    const isMobile = useMobile();
    const [showTooltip, setShowTooltip] = useState(false);
    const timerRef = useRef<number | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (showTooltip && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setTooltipPosition({
                top: rect.bottom + 8,
                left: rect.left + rect.width / 2,
            });
        }
    }, [showTooltip]);

    const handleMouseEnter = () => {
        if (isMobile) return;
        timerRef.current = window.setTimeout(() => {
            setShowTooltip(true);
        }, 500);
    };

    const handleMouseLeave = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setShowTooltip(false);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    const tooltipElement = showTooltip && !isMobile
        ? (
            <div
                className="fixed z-[9999] px-2 py-1 text-xs font-medium whitespace-nowrap bg-popover text-popover-foreground rounded-md shadow-md border border-border animate-in fade-in-0 zoom-in-95 duration-200"
                style={{
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                    transform: "translate(-50%, 0)",
                }}
                role="tooltip"
            >
                {tooltipText}
            </div>
        )
        : null;

    return { buttonRef, tooltipElement, handleMouseEnter, handleMouseLeave };
}

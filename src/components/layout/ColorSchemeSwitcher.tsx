import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSettingsStore, useShareSettingsStore, COLOR_SCHEMES } from "@/lib/stores/settings-store";
import { toast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";


interface ColorSchemeSwitcherProps {
    className?: string;
    isShare?: boolean;
}

export function ColorSchemeSwitcher({ className, isShare = false }: ColorSchemeSwitcherProps) {
    const { t } = useTranslation();
    const mainStore = useSettingsStore();
    const shareStore = useShareSettingsStore();
    const settingsStore = isShare ? shareStore : mainStore;
    const { colorScheme, setColorScheme } = settingsStore;

    const [showTooltip, setShowTooltip] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const timerRef = useRef<number | null>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
    const isMobile = useMobile()

    useEffect(() => {
        if (showTooltip && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setTooltipPosition({
                top: rect.bottom + 8,
                left: rect.left + rect.width / 2,
            })
        }
    }, [showTooltip])

    const handleMouseEnter = () => {
        if (isMobile) return
        timerRef.current = window.setTimeout(() => {
            setShowTooltip(true)
        }, 500)
    }

    const handleMouseLeave = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setShowTooltip(false)
    }

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current)
            }
        }
    }, [])

    const tooltipElement = showTooltip && !isMobile ? (
        <div
            className={cn(
                "fixed z-[9999] px-2 py-1 text-xs font-medium whitespace-nowrap",
                "bg-popover text-popover-foreground",
                "rounded-md shadow-md border border-border",
                "animate-in fade-in-0 zoom-in-95 duration-200"
            )}
            style={{
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                transform: "translate(-50%, 0)",
            }}
            role="tooltip"
        >
            {t("ui.settings.colorScheme")}
        </div>
    ) : null

    return (
        <>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        ref={buttonRef}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "size-9 hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-0",
                            isOpen && "ring-2 ring-ring",
                            className
                        )}
                        aria-label={t("ui.settings.colorScheme")}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Palette className="size-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuRadioGroup
                        value={colorScheme}
                        onValueChange={(value) => {
                            const selectedScheme = COLOR_SCHEMES.find((scheme) => scheme.value === value);
                            if (!selectedScheme) return;

                            setColorScheme(selectedScheme.value);
                            toast.success(t("ui.settings.colorSchemeSwitched", { scheme: t(selectedScheme.label) }));
                        }}
                    >
                        {COLOR_SCHEMES.map((scheme) => (
                            <DropdownMenuRadioItem key={scheme.value} value={scheme.value} className="rounded-lg cursor-pointer">
                                <span className="mr-2 flex h-2 w-2 rounded-full" style={{ backgroundColor: scheme.color }} />
                                {t(scheme.label)}
                                {colorScheme === scheme.value && <Check className="ml-auto h-4 w-4" />}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            {typeof document !== 'undefined' && createPortal(tooltipElement, document.body)}
        </>
    );
}

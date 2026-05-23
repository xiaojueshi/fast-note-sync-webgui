import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sun, Moon, SunMoon, Monitor } from "lucide-react";
import { useTheme } from "@/components/context/theme-context";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";


type Theme = "system" | "auto" | "light" | "dark";

interface ThemeOption {
    value: Theme;
    labelKey: string;
    Icon: React.ComponentType<{ className?: string; size?: number }>;
}

const THEME_OPTIONS: ThemeOption[] = [
    { value: "system", labelKey: "ui.settings.themeSystem", Icon: Monitor },
    { value: "auto", labelKey: "ui.settings.themeAuto", Icon: SunMoon },
    { value: "light", labelKey: "ui.settings.themeLight", Icon: Sun },
    { value: "dark", labelKey: "ui.settings.themeDark", Icon: Moon },
];

interface ThemeSwitcherProps {
    /** Extra class name applied to the trigger button */
    className?: string;
    /** Dropdown content alignment */
    align?: "start" | "center" | "end";
    /**
     * If true, renders a plain <button> trigger instead of the shadcn Button.
     * Used by auth-form to keep the existing `auth-floating-switcher` styling.
     */
    asPlainButton?: boolean;
    /** Aria label override for the trigger */
    ariaLabel?: string;
    /** Icon size used by the trigger when asPlainButton=true */
    iconSize?: number;
}

/**
 * ThemeSwitcher - 主题选择下拉菜单
 *
 * 提供一个下拉菜单让用户直接选择主题（跟随系统 / 自动 / 浅色 / 深色），
 * 替代之前的循环点击切换交互。
 *
 * - 触发按钮根据当前生效主题展示对应图标
 * - 下拉菜单内通过 RadioGroup 高亮当前选中项
 * - 通过 `asPlainButton` 适配登录页等使用自定义按钮样式的位置
 */
export function ThemeSwitcher({
    className,
    align = "end",
    asPlainButton = false,
    ariaLabel,
    iconSize,
}: ThemeSwitcherProps) {
    const { t } = useTranslation();
    const { theme, resolvedTheme, setTheme } = useTheme();

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

    const TriggerIcon = (() => {
        if (theme === "auto") return SunMoon;
        if (theme === "system") return Monitor;
        return resolvedTheme === "dark" ? Moon : Sun;
    })();


    const accentColor = theme === "auto" || theme === "system";

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
            {t("ui.common.toggleTheme")}
        </div>
    ) : null

    return (
        <>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    {asPlainButton ? (
                    <button
                        ref={buttonRef}
                        type="button"
                        className={className}
                        aria-label={ariaLabel ?? t("ui.common.toggleTheme")}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <TriggerIcon size={iconSize ?? 18} className={accentColor ? "text-primary" : undefined} />
                    </button>
                ) : (
                    <Button
                        ref={buttonRef}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "size-9 hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-0",
                            isOpen && "ring-2 ring-ring",
                            className
                        )}
                        aria-label={ariaLabel ?? t("ui.common.toggleTheme")}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <TriggerIcon className={cn("size-5", accentColor && "text-primary")} />
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-44 rounded-xl">
                <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value as Theme)}
                >
                    {THEME_OPTIONS.map(({ value, labelKey, Icon }) => (
                        <DropdownMenuRadioItem
                            key={value}
                            value={value}
                            className="rounded-lg cursor-pointer"
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            {t(labelKey)}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
            </DropdownMenu>
            {typeof document !== 'undefined' && createPortal(tooltipElement, document.body)}
        </>
    );
}

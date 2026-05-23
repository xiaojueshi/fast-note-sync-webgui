import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { changeLang } from "@/i18n/utils";
import { Languages } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";


interface LanguageSwitcherProps {
    className?: string;
    showText?: boolean;
    storageKey?: string;
}

export function LanguageSwitcher({ className, showText = false, storageKey = "lang" }: LanguageSwitcherProps) {
    const { t } = useTranslation();

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

    const handleSwitch = (lang: string) => {
        changeLang(lang, storageKey);
    };

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
            {t("ui.common.switchLanguage")}
        </div>
    ) : null

    return (
        <>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button 
                        ref={buttonRef}
                        variant="ghost" 
                        size={showText ? "default" : "icon"} 
                        className={cn(
                            "hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-0",
                            isOpen && "ring-2 ring-ring",
                            className
                        )}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Languages className={showText ? "mr-2 h-4 w-4" : "h-5 w-5"} />
                        {showText && t("ui.common.switchLanguage")}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem onClick={() => handleSwitch("en")}>🇺🇸 English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSwitch("zh-CN")}>🇨🇳 简体中文</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSwitch("zh-TW")}>🇭🇰 繁體中文</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSwitch("ja")}>🇯🇵 日本語</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSwitch("ko")}>🇰🇷 한국어</DropdownMenuItem>
                {/*
                <DropdownMenuItem onClick={() => changeLang("fr")}>🇫🇷 Français</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("de")}>🇩🇪 Deutsch</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("es")}>🇪🇸 Español</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("it")}>🇮🇹 Italiano</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("pt")}>🇵🇹 Português</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("pt-BR")}>🇧🇷 Português (Brasil)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ru")}>🇷🇺 Русский</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("uk")}>🇺🇦 Українська</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("be")}>🇧🇾 Беларуская</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("nl")}>🇳🇱 Nederlands</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("pl")}>🇵🇱 Polski</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("da")}>🇩🇰 Dansk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("no")}>🇳🇴 Norsk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("tr")}>🇹🇷 Türkçe</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("vi")}>🇻🇳 Tiếng Việt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("th")}>🇹🇭 ไทย</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("hi")}>🇮🇳 हिन्दी</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("id")}>🇮🇩 Indonesia</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ms")}>🇲🇾 Bahasa Melayu</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ro")}>🇷🇴 Română</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ca")}>🌐 Català</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("hu")}>🇭🇺 Magyar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ar")}>🇸🇦 العربية</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("he")}>🇮🇱 עברית</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("ne")}>🇳🇵 नेपाली</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang("sq")}>🇦🇱 Shqip</DropdownMenuItem>
                */}
            </DropdownMenuContent>
            </DropdownMenu>
            {typeof document !== 'undefined' && createPortal(tooltipElement, document.body)}
        </>
    );
}

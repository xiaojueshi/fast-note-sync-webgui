import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSettingsStore, useShareSettingsStore, COLOR_SCHEMES } from "@/lib/stores/settings-store";
import { toast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Palette, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDropdownTooltip } from "@/hooks/use-dropdown-tooltip";


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

    const [isOpen, setIsOpen] = useState(false)
    const { buttonRef, tooltipElement, handleMouseEnter, handleMouseLeave } = useDropdownTooltip(t("ui.settings.colorScheme"))

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
            {typeof document !== 'undefined' && tooltipElement}
        </>
    );
}

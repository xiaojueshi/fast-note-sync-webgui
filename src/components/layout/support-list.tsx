import { Heart, RefreshCw, Loader2, MessageCircle, Smile, Coffee, QrCode, ExternalLink, Trophy, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useSupport } from "@/components/api-handle/use-support";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";


type SortKey = "time" | "amount" | "amount_3m";
type SortOrder = "asc" | "desc";

export function SupportList() {
    const { t, i18n } = useTranslation()
    const { supportList, pager, isLoading, error, refresh } = useSupport()
    const [page, setPage] = useState(1);
    const [pageSize] = useState(15);
    const [sortKey, setSortKey] = useState<SortKey>("amount_3m");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    useEffect(() => {
        refresh(page, pageSize, sortKey, sortOrder)
    }, [refresh, page, pageSize, sortKey, sortOrder, i18n.language])

    const handleSortChange = (key: SortKey) => {
        setSortKey(key);
        setPage(1);
    };

    const getInitials = (name: string) => {
        if (!name) return "?";
        return name.charAt(0).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
            'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (isLoading && supportList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <span className="text-sm text-muted-foreground">{t("ui.common.loading")}</span>
            </div>
        )
    }

    if (error && supportList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-full space-y-4">
                <AlertCircle className="h-8 w-8 text-destructive opacity-50" />
                <div className="text-sm text-destructive font-medium">{error}</div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refresh(page, pageSize, sortKey, sortOrder)}
                    className="rounded-xl border-primary/20 hover:border-primary/50"
                >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    {t("ui.common.retry", { defaultValue: "重试" })}
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full space-y-1.5 focus-visible:outline-none">
            <div className="flex items-center justify-between pb-0.5">
                <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500/10" />
                    {t("ui.support.title")}
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refresh(page, pageSize, sortKey, sortOrder)}
                    disabled={isLoading}
                    className="h-6 w-6 rounded-full hover:bg-muted"
                >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
                {t("ui.support.supportRequest")}
            </p>

            {/* Donation Methods */}
            <div className="fns-support-cards-container">
                {/* Ko-fi Card */}
                <div className="fns-support-card">
                    <div className="fns-support-card-header">
                        <span className="fns-support-card-icon">☕</span>
                        <span className="fns-support-card-title">{t("ui.support.buyMeACoffee")}</span>
                    </div>
                    <div className="fns-support-card-body">
                        <a href="https://ko-fi.com/haierkeys" target="_blank" rel="noreferrer" className="fns-support-link">
                            <img src="/static/images/kofi.png" className="fns-support-img-kofi" alt="Ko-fi" />
                        </a>
                    </div>
                </div>

                {/* WeChat Pay Card */}
                <div className="fns-support-card">
                    <div className="fns-support-card-header">
                        <span className="fns-support-card-icon">🧧</span>
                        <span className="fns-support-card-title">{t("ui.support.wechatReward")}</span>
                    </div>
                    <div className="fns-support-card-body">
                        <div className="fns-wechat-qr-wrapper">
                            <img src="/static/images/wxds.png" className="fns-support-img-wechat" alt="WeChat Pay" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pl-1 pt-1 pb-1">
                <h3 className="text-xs font-bold text-muted-foreground/80 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-500/80 fill-amber-500/10" />
                    {t("ui.support.listTitle")}
                    <span className="text-[10px] opacity-50 font-normal">
                        {sortKey === 'amount_3m' ? `(${t("ui.support.rangeLastThreeMonths")})` : `(${t("ui.support.rangeAllTime")})`}
                    </span>
                </h3>

                <div className="flex items-center bg-secondary/80 rounded-lg p-0.5 border border-border/50 shadow-inner">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSortChange("amount_3m")}
                        className={`h-5 min-h-0 px-2 text-[10px] rounded-md transition-all ${sortKey === "amount_3m" ? "bg-card text-primary shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {t("ui.support.sortAmountHalfYear")}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSortChange("amount")}
                        className={`h-5 min-h-0 px-2 text-[10px] rounded-md transition-all ${sortKey === "amount" ? "bg-card text-primary shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {t("ui.support.sortDefault")}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSortChange("time")}
                        className={`h-5 min-h-0 px-2 text-[10px] rounded-md transition-all ${sortKey === "time" ? "bg-card text-primary shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {t("ui.support.sortTime")}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-border/40 rounded-lg bg-card/10 custom-scrollbar relative min-h-30">
                {supportList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-60 py-8">
                        <MessageCircle className="h-6 w-6 stroke-[1.5]" />
                        <span className="text-xs italic">{t("ui.support.noData")}</span>
                    </div>
                ) : (
                    <div className="divide-y divide-border/25">
                        {supportList.map((record, index) => {
                            const tooltipContent = `${record.name || "Anonymous"}: ${record.message || record.item}`;

                            return (
                                <div key={index} className="w-full">
                                    <Tooltip
                                        side="left"
                                        delay={300}
                                        content={tooltipContent}
                                        className="max-w-75 whitespace-normal"
                                        triggerClassName="w-full"
                                    >
                                        <div className="group grid grid-cols-[60px_1fr_100px] gap-3 px-3 py-2 items-center hover:bg-muted/60 transition-all cursor-default rounded-lg w-full">
                                            {/* Date */}
                                            <div className="text-[10px] text-muted-foreground font-mono tabular-nums opacity-50 shrink-0">
                                                {(record.time || "").split(' ')[0].substring(2) || "N/A"}
                                            </div>
                                            
                                            {/* Name and Message */}
                                            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 shadow-sm ${getAvatarColor(record.name)}`}>
                                                    {getInitials(record.name)}
                                                </div>
                                                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                                    <span className="text-[11px] font-semibold text-foreground/90 shrink-0">
                                                        {record.name || "Anonymous"}
                                                    </span>
                                                    {record.message && (
                                                        <span className="text-[11px] text-foreground/70 truncate opacity-80 group-hover:opacity-100 transition-opacity border-l border-border/50 pl-2">
                                                            {record.message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="justify-self-end shrink-0">
                                                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    {record.amount} <span className="text-[9px] font-normal ml-0.5 opacity-80">{record.unit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Tooltip>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {pager && pager.totalRows > 0 && (
                <div className="flex items-center justify-between pt-1 pb-1 px-1">
                    <div className="text-[10px] text-muted-foreground opacity-70">
                        {t("ui.common.total", { defaultValue: `共 ${pager.totalRows} 条` })}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-muted"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || isLoading}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-[10px] text-muted-foreground font-mono tabular-nums min-w-7.5 text-center">
                            {page} / {Math.max(1, Math.ceil(pager.totalRows / pageSize))}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-muted"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= Math.ceil(pager.totalRows / pageSize) || isLoading}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            <div className="pt-0.5 text-[10px] text-center text-muted-foreground italic opacity-40">
                {t("ui.support.thanks")}
            </div>
        </div>
    )
}

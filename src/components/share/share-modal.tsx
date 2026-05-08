import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useShareHandle } from "@/components/api-handle/share-handle";
import { Share2, Copy, Link2Off, ExternalLink, Loader2, CheckCircle2, Lock, Eye, EyeOff, Check, Link2, Globe } from "lucide-react";
import { toast } from "@/components/common/Toast";
import type { ShareCreateResponse } from "@/lib/types/share";
import { Tooltip } from "@/components/ui/tooltip";

interface ShareModalProps {
    vault: string;
    path: string;
    pathHash: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onShareChange?: () => void;
}

export function ShareModal({ vault, path, pathHash, open, onOpenChange, onShareChange }: ShareModalProps) {
    const { t } = useTranslation();
    const { handleGetShareByPath, handleCreateShare, handleCancelShare, handleUpdateSharePassword, handleCreateShortLink } = useShareHandle();

    const [loading, setLoading] = useState(false);
    const [shareData, setShareData] = useState<ShareCreateResponse | null>(null);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [shortLink, setShortLink] = useState("");
    const [shortLinkLoading, setShortLinkLoading] = useState(false);

    const checkShareStatus = useCallback(() => {
        setLoading(true);
        handleGetShareByPath(
            vault,
            path,
            pathHash,
            (data) => {
                setShareData(data);
                // 接口不返回真实的 password，如果 isPassword 为 true，直接填充虚拟占位符
                if (data.isPassword) {
                    setPassword("******");
                } else {
                    setPassword("");
                }
                setShortLink(data.shortLink || "");
                setLoading(false);
            },
            () => {
                setShareData(null);
                setShowPassword(false);
                setLoading(false);
            }
        );
    }, [vault, path, pathHash, handleGetShareByPath]);

    useEffect(() => {
        if (open) {
            checkShareStatus();
        } else {
            setShareData(null);
            setPassword("");
            setShowPassword(false);
            setShortLink("");
        }
    }, [open, checkShareStatus]);

    const fetchShortLink = useCallback(() => {
        if (!shareData) return;
        setShortLinkLoading(true);
        handleCreateShortLink({ vault, path, pathHash, url: getFullUrl(shareData) }, (url: string) => {
            setShortLink(url);
            setShortLinkLoading(false);
        });
    }, [vault, path, pathHash, shareData, handleCreateShortLink]);

    const onCreateShare = async () => {
        setLoading(true);
        handleCreateShare(vault, path, pathHash, (data) => {
            setShareData(data);
            setShortLink(data.shortLink || "");
            setLoading(false);
            toast.success(t("ui.share.success"));
            onShareChange?.();
        });
    };

    const onCancelShare = async () => {
        setLoading(true);
        handleCancelShare({ vault, path, pathHash }, () => {
            setShareData(null);
            setLoading(false);
            toast.success(t("ui.share.cancelSuccess"));
            onShareChange?.();
        });
    };

    const onUpdatePassword = () => {
        if (!shareData) return;
        // 如果密码是虚拟占位符且没有修改，则无需更新
        if (password === "******" && shareData.isPassword) {
            toast.error(t("ui.common.noChange") || "No changes to save");
            return;
        }
        handleUpdateSharePassword({ vault, path, pathHash, password }, () => {
            toast.success(t("ui.common.saveSuccess"));
            // 更新成功后重新获取状态以同步 isPassword 等字段
            checkShareStatus();
        });
    };

    const getFullUrl = (data?: ShareCreateResponse) => {
        if (!data || !data.token) return "";
        const base = data.baseUrl || "";
        return `${base}/share/${data.id}/${data.token}`;
    };

    const onCopyLink = () => {
        if (!shareData) return;
        const fullUrl = getFullUrl(shareData);
        navigator.clipboard.writeText(fullUrl).then(() => {
            toast.success(t("ui.share.copySuccess"));
        });
    };

    const onViewShare = () => {
        if (!shareData) return;
        const fullUrl = getFullUrl(shareData);
        window.open(fullUrl, "_blank");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden shadow-2xl border-none">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        {t("ui.share.title")}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="text-sm text-muted-foreground break-all bg-muted/50 p-3 rounded-xl border border-border/50">
                        {path}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground animate-in fade-in duration-300">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm">{t("ui.share.checking")}</p>
                        </div>
                    ) : shareData ? (
                        <div className="space-y-4 animate-in zoom-in-95 duration-200">
                            {/* 链接部分 */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {t("ui.share.link")}
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1 group">
                                        <Input
                                            readOnly
                                            value={getFullUrl(shareData)}
                                            className="pr-10 bg-muted/30 border-muted-foreground/20 hover:border-primary/50 transition-colors rounded-xl"
                                        />
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                           <Tooltip content={t("ui.share.copy")} side="top">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                                    onClick={onCopyLink}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                           </Tooltip>
                                        </div>
                                    </div>
                                    <Tooltip content={t("ui.share.viewShare")} side="top">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0 border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all rounded-xl shadow-sm"
                                            onClick={onViewShare}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* 密码管理 */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    {t("ui.user.password")}
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={t("ui.share.passwordPlaceholder") || "Set a password (Optional)"}
                                            className="pr-10 bg-muted/30 border-muted-foreground/20 hover:border-primary/50 transition-colors rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                            onClick={() => {
                                                const nextShow = !showPassword;
                                                setShowPassword(nextShow);
                                                // 如果切换到明文显示且当前是虚拟占位符，则清空，方便用户输入新密码
                                                if (nextShow && password === "******") {
                                                    setPassword("");
                                                } else if (!nextShow && password === "" && shareData?.isPassword) {
                                                    // 如果切换回隐藏模式且用户未输入内容，则恢复虚拟占位符
                                                    setPassword("******");
                                                }
                                            }}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <Tooltip content={t("ui.common.save")} side="top">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0 border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all rounded-xl shadow-sm"
                                            onClick={onUpdatePassword}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* 短链接部分 */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1">
                                    <Link2 className="h-3 w-3" />
                                    {t("ui.share.shortLink")}
                                </label>
                                <div className="flex items-center gap-2">
                                    {shortLink ? (
                                        <div className="relative flex-1 group">
                                            <Input
                                                readOnly
                                                value={shortLink}
                                                className="pr-10 bg-muted/30 border-muted-foreground/20 hover:border-primary/50 transition-colors rounded-xl"
                                            />
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                               <Tooltip content={t("ui.share.shortLinkCopy")} side="top">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(shortLink).then(() => {
                                                                toast.success(t("ui.share.copySuccess"));
                                                            });
                                                        }}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                               </Tooltip>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start rounded-xl border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all h-10 px-4"
                                            onClick={fetchShortLink}
                                            disabled={shortLinkLoading}
                                        >
                                            {shortLinkLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Link2 className="h-4 w-4 mr-2" />
                                            )}
                                            {t("ui.share.shortLinkCreate")}
                                        </Button>
                                    )}
                                    {shortLink && (
                                        <Tooltip content={t("ui.common.refresh")} side="top">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 shrink-0 border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all rounded-xl shadow-sm"
                                                onClick={() => {
                                                    setShortLink("");
                                                    fetchShortLink();
                                                }}
                                                disabled={shortLinkLoading}
                                            >
                                                <Loader2 className={`h-4 w-4 ${shortLinkLoading ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in fade-in duration-300">
                             <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Share2 className="h-8 w-8 text-primary opacity-60" />
                             </div>
                             <p className="text-sm text-muted-foreground text-center px-4">
                                {t("ui.share.noShares")}
                             </p>
                             <Button
                                onClick={onCreateShare}
                                disabled={loading}
                                className="w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
                            >
                                {t("ui.share.create")}
                            </Button>
                        </div>
                    )}
                </div>

                {shareData && !loading && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4 w-full">
                        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/5 px-3 py-1.5 rounded-full border border-green-200/50">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>{t("ui.share.success")}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors rounded-xl font-medium"
                            onClick={onCancelShare}
                            disabled={loading}
                        >
                            <Link2Off className="h-4 w-4 mr-2" />
                            {t("ui.share.cancelShare")}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

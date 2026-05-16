import { RefreshCw, Loader2, Laptop, Smartphone, Monitor, UserMinus, Key } from "lucide-react";
import { useWSClientInfo } from "@/components/api-handle/use-ws-clients";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAppStore } from "@/stores/app-store";
import { useState } from "react";
import { toast } from "@/components/common/Toast";


export function WSClientList() {
    const { t } = useTranslation();
    const { clients, isLoading, refresh, kickClient } = useWSClientInfo();
    const setModule = useAppStore(state => state.setModule);
    const setHighlightTokenId = useAppStore(state => state.setHighlightTokenId);

    const [kickingId, setKickingId] = useState<string | null>(null);
    const [isKicking, setIsKicking] = useState(false);

    const handleKick = async (traceId: string) => {
        setIsKicking(true);
        try {
            await kickClient(traceId);
            toast.success(t("ui.common.success"));
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || t("ui.common.error"));
        } finally {
            setIsKicking(false);
            setKickingId(null);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 custom-shadow">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    {t("ui.system.websocketClients")}
                </h2>
                <div className="flex items-center gap-2">
                    {clients.length > 0 && (
                        <Badge variant="outline" className="text-[10px] font-normal opacity-70">
                            {clients.length} {t("ui.common.count")}
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refresh()}
                        disabled={isLoading}
                        className="h-8 w-8 rounded-full hover:bg-muted"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {clients.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground italic border border-dashed border-border/50 rounded-lg">
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t("ui.common.loading")}</span>
                            </div>
                        ) : (
                            t("ui.system.wsNoClients")
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {clients.map((client) => (
                            <div key={client.traceId} className="p-3 bg-secondary/20 rounded-lg border border-border/50 space-y-2 relative overflow-hidden group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-background rounded-md border border-border/50">
                                            {client.platformInfo?.isMobile ? (
                                                <Smartphone className="h-3.5 w-3.5 text-primary" />
                                            ) : (
                                                <Laptop className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold leading-none flex items-center gap-1.5">
                                                {client.clientName || client.nickname || t("ui.common.unknown")}
                                                <span className="text-[10px] font-normal text-muted-foreground opacity-70">v{client.clientVersion}</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 font-mono opacity-80">
                                                {client.remoteAddr}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[10px] font-medium h-5">
                                            {client.clientType}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-border/10">
                                    <div className="text-[10px] text-muted-foreground">
                                        {t("ui.system.wsStartTime")}: {new Date(client.startTime).toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono opacity-40 group-hover:opacity-100 transition-opacity">
                                        <span>{t("ui.auth.userUid", { uid: client.uid })}</span>
                                        {client.tokenId > 0 && (
                                            <span 
                                                className="text-primary/70 flex items-center gap-1 border-l border-border/20 pl-2 cursor-pointer hover:underline hover:text-primary transition-colors"
                                                onClick={() => {
                                                    setHighlightTokenId(client.tokenId);
                                                    setModule('vaults');
                                                }}
                                            >
                                                <Key className="h-2.5 w-2.5" />
                                                {t("ui.system.wsTokenId")}: {client.tokenId}
                                            </span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setKickingId(client.traceId)}
                                            className="h-5 w-5 !min-h-0 rounded-md text-destructive/40 hover:text-destructive hover:bg-destructive/10 ml-1.5 transition-all border border-transparent hover:border-destructive/20 active:scale-95 shadow-none hover:shadow-sm"
                                            title={t("ui.system.wsKick")}
                                        >
                                            <UserMinus className="h-2.5 w-2.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!kickingId} onOpenChange={(open) => !open && setKickingId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("ui.system.wsKick")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("ui.system.wsKickConfirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">{t("ui.common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => kickingId && handleKick(kickingId)}
                            className="rounded-xl bg-destructive hover:bg-destructive/90"
                            disabled={isKicking}
                        >
                            {isKicking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("ui.common.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

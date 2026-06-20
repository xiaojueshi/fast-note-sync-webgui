import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSyncLogHandle } from "@/components/api-handle/sync-log-handle";
import { useVaultHandle } from "@/components/api-handle/vault-handle";
import { SyncLogList } from "./sync-log-list";
import { SyncLogItem } from "@/lib/types/sync-log";
import { VaultType } from "@/lib/types/vault";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Logs, RefreshCw, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncLogManagerProps {
    vault?: string | null;
    onVaultChange?: (vault: string | null) => void;
}

export function SyncLogManager({ vault, onVaultChange }: SyncLogManagerProps) {
    const { t } = useTranslation();
    const { handleSyncLogList } = useSyncLogHandle();
    const { handleVaultList } = useVaultHandle();

    const [logs, setLogs] = useState<SyncLogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [vaults, setVaults] = useState<VaultType[]>([]);
    
    // Filters
    const [filterVault, setFilterVault] = useState<string>(vault || "all");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterAction, setFilterAction] = useState<string>("all");
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 20;

    const fetchLogs = useCallback(() => {
        setLoading(true);
        handleSyncLogList({
            vault: filterVault === "all" ? undefined : filterVault,
            type: filterType === "all" ? undefined : filterType,
            action: filterAction === "all" ? undefined : filterAction,
            page: currentPage,
            pageSize
        }, (data) => {
            setLogs(data.list || []);
            const total = data.pager?.totalRows || 0;
            setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
            setLoading(false);
        }, () => {
            setLoading(false);
        });
    }, [handleSyncLogList, filterVault, filterType, filterAction, currentPage]);

    // Load vaults for filter
    useEffect(() => {
        handleVaultList((data) => setVaults(data));
    }, [handleVaultList]);

    // Fetch logs on filter/page change
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Sync external vault prop to internal filter
    useEffect(() => {
        if (vault && vault !== filterVault) {
            setFilterVault(vault);
            setCurrentPage(1);
        } else if (!vault && filterVault !== "all") {
            setFilterVault("all");
            setCurrentPage(1);
        }
    }, [vault, filterVault]);

    const handleVaultFilterChange = (v: string) => {
        setFilterVault(v);
        setCurrentPage(1);
        if (onVaultChange) {
            onVaultChange(v === "all" ? null : v);
        }
    };

    const resetFilters = () => {
        setFilterVault("all");
        setFilterType("all");
        setFilterAction("all");
        setCurrentPage(1);
    };

    return (
        <div className="w-full space-y-6 pt-2">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                        <Logs className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{t("ui.syncLog.title")}</h2>
                        <p className="text-sm text-muted-foreground">{t("ui.syncLog.description")}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Vault Selector */}
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <Select value={filterVault} onValueChange={handleVaultFilterChange}>
                            <SelectTrigger className="rounded-xl h-10 bg-card hover:bg-muted/50 transition-colors">
                                <SelectValue placeholder={t("ui.syncLog.vault")} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                                <SelectItem value="all" className="rounded-lg">{t("ui.syncLog.allVaults")}</SelectItem>
                                {vaults.map(v => (
                                    <SelectItem key={v.id} value={v.vault} className="rounded-lg">{v.vault}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type Selector */}
                    <div className="flex flex-col gap-1.5 min-w-[110px]">
                        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
                            <SelectTrigger className="rounded-xl h-10 bg-card hover:bg-muted/50 transition-colors">
                                <SelectValue placeholder={t("ui.syncLog.type")} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                                <SelectItem value="all" className="rounded-lg">{t("ui.syncLog.allTypes")}</SelectItem>
                                <SelectItem value="note" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#08b94e]" />
                                        <span className="uppercase">{t("ui.syncLog.type.note")}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="file" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#7C4DFF]" />
                                        <span className="uppercase">{t("ui.syncLog.type.file")}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="folder" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#1E88E5]" />
                                        <span className="uppercase">{t("ui.syncLog.type.folder")}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="setting" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#FF8A33]" />
                                        <span className="uppercase">{t("ui.syncLog.type.setting")}</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Selector */}
                    <div className="flex flex-col gap-1.5 min-w-[110px]">
                        <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setCurrentPage(1); }}>
                            <SelectTrigger className="rounded-xl h-10 bg-card hover:bg-muted/50 transition-colors">
                                <SelectValue placeholder={t("ui.syncLog.action")} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                                <SelectItem value="all" className="rounded-lg">{t("ui.syncLog.allActions")}</SelectItem>
                                <SelectItem value="create" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="uppercase">{t("ui.syncLog.action.create")}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="modify" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="uppercase">{t("ui.syncLog.action.modify")}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="soft_delete" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        <span className="uppercase">{t("ui.syncLog.action.soft_delete")}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="delete" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="uppercase">{t("ui.syncLog.action.delete")}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="rename" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span className="uppercase">{t("ui.syncLog.action.rename")}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="restore" className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="uppercase">{t("ui.syncLog.action.restore")}</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className={cn(
                                "h-10 w-10 rounded-xl bg-card border-border hover:bg-muted/50 transition-all",
                                (filterVault !== "all" || filterType !== "all" || filterAction !== "all") && "border-primary/50 text-primary bg-primary/5"
                            )}
                            onClick={resetFilters}
                            title={t("ui.syncLog.resetFilters")}
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>

                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl bg-card border-border hover:bg-muted/50 transition-all"
                            onClick={fetchLogs}
                            disabled={loading}
                            title={t("ui.common.refresh")}
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <SyncLogList 
                logs={logs} 
                vaults={vaults}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}

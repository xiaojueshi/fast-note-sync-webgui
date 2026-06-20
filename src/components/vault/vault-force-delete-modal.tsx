import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { useVaultHandle } from "@/components/api-handle/vault-handle";
import { buildApiHeaders } from "@/lib/utils/api-headers";
import { addCacheBuster } from "@/lib/utils/cache-buster";
import { FileText, Paperclip, Search, Trash2, X, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { VaultType } from "@/lib/types/vault";
import { Input } from "@/components/ui/input";
import env from "@/env.ts";

// SearchResultItem represents note or file search result item
// SearchResultItem 表示搜索出的笔记或附件对象
interface SearchResultItem {
  id: number;
  path: string;
  pathHash: string;
  type: "note" | "file";
  isRecycle: boolean;
}

// API 返回的笔记/文件列表项类型
interface ApiListItem {
  id: number;
  path: string;
  pathHash?: string;
}

// VaultForceDeleteModalProps represents props of the modal component
// VaultForceDeleteModalProps 物理删除模态窗的属性接口
interface VaultForceDeleteModalProps {
  open: boolean; // Control whether the dialog is open // 控制弹窗是否打开
  onOpenChange: (open: boolean) => void; // Callback when open status changes // 打开状态变更回调
  vault: VaultType | null; // The selected vault details // 选中的笔记本信息
}

export function VaultForceDeleteModal({ open, onOpenChange, vault }: VaultForceDeleteModalProps) {
  const { t } = useTranslation();
  const { openConfirmDialog } = useConfirmDialog();
  const { handleVaultForceDeleteItem } = useVaultHandle();

  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);

  const token = localStorage.getItem("token")!;

  // Clear states when modal is opened/closed
  // 当弹窗打开或关闭时，清空输入框和搜索结果
  useEffect(() => {
    if (!open) {
      setKeyword("");
      setResults([]);
      setIsLoading(false);
    }
  }, [open]);

  // Execute combined search for notes and files
  // 执行笔记和附件的联合搜索
  const handleSearch = useCallback(async (searchKey: string) => {
    if (!vault || !searchKey.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const cleanKey = searchKey.trim();
      const headers = buildApiHeaders({ token });

      // Build endpoints for searching active and recycle bin notes and files
      // 构建搜索正常和回收站中的笔记和附件的接口地址
      const notesUrl = addCacheBuster(
        `${env.API_URL}/api/notes?vault=${encodeURIComponent(vault.vault)}&page=1&pageSize=100&keyword=${encodeURIComponent(cleanKey)}&isRecycle=false`
      );
      const notesRecycleUrl = addCacheBuster(
        `${env.API_URL}/api/notes?vault=${encodeURIComponent(vault.vault)}&page=1&pageSize=100&keyword=${encodeURIComponent(cleanKey)}&isRecycle=true`
      );
      const filesUrl = addCacheBuster(
        `${env.API_URL}/api/files?vault=${encodeURIComponent(vault.vault)}&page=1&pageSize=100&keyword=${encodeURIComponent(cleanKey)}&isRecycle=false`
      );
      const filesRecycleUrl = addCacheBuster(
        `${env.API_URL}/api/files?vault=${encodeURIComponent(vault.vault)}&page=1&pageSize=100&keyword=${encodeURIComponent(cleanKey)}&isRecycle=true`
      );

      // Request in parallel
      // 并行请求正常与回收站的所有搜索接口
      const [notesRes, notesRecycleRes, filesRes, filesRecycleRes] = await Promise.all([
        fetch(notesUrl, { method: "GET", headers }),
        fetch(notesRecycleUrl, { method: "GET", headers }),
        fetch(filesUrl, { method: "GET", headers }),
        fetch(filesRecycleUrl, { method: "GET", headers }),
      ]);

      const notesList: SearchResultItem[] = [];
      const filesList: SearchResultItem[] = [];

      // Helper to process response helper
      const processNotes = async (res: Response, isRecycle: boolean) => {
        if (res.ok) {
          const resObj = await res.json();
          const rawList = resObj.data?.list || (Array.isArray(resObj.data) ? resObj.data : []);
          if (Array.isArray(rawList)) {
            rawList.forEach((item: ApiListItem) => {
              notesList.push({
                id: item.id,
                path: item.path,
                pathHash: item.pathHash || "",
                type: "note",
                isRecycle,
              });
            });
          }
        }
      };

      const processFiles = async (res: Response, isRecycle: boolean) => {
        if (res.ok) {
          const resObj = await res.json();
          const rawList = resObj.data?.list || (Array.isArray(resObj.data) ? resObj.data : []);
          if (Array.isArray(rawList)) {
            rawList.forEach((item: ApiListItem) => {
              filesList.push({
                id: item.id,
                path: item.path,
                pathHash: item.pathHash || "",
                type: "file",
                isRecycle,
              });
            });
          }
        }
      };

      await Promise.all([
        processNotes(notesRes, false),
        processNotes(notesRecycleRes, true),
        processFiles(filesRes, false),
        processFiles(filesRecycleRes, true),
      ]);

      // Merge results
      // 合并所有搜索结果
      setResults([...notesList, ...filesList]);
    } catch (err) {
      console.error("Failed to fetch search results", err);
      toast.error(t("ui.common.error", "操作失败"));
    } finally {
      setIsLoading(false);
    }
  }, [vault, token, t]);

  // Debounced search trigger
  // 防抖搜索触发器
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.trim()) {
        handleSearch(keyword);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, handleSearch]);

  // Handle single item deletion
  // 处理单条数据物理删除
  const handleDeleteItem = (item: SearchResultItem) => {
    if (!vault) return;

    // Use dialog confirmation with warnings
    // 二次确认，并高亮显示被删除项的路径
    const confirmMessage = t("ui.vault.forceDeleteConfirm", { path: item.path }) || 
      `⚠️ 警告：危险操作！\n\n确定要永久物理删除“${item.path}”吗？此操作将立即从数据库和磁盘中彻底抹除该文件，且不可恢复！`;

    openConfirmDialog(
      confirmMessage,
      "confirm",
      async () => {
        try {
          await handleVaultForceDeleteItem(Number(vault.id), item.type, item.id);
          // Dynamically remove item from list
          // 从结果列表中动态移除被删行
          setResults((prev) => prev.filter((r) => !(r.id === item.id && r.type === item.type)));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : String(error));
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl mx-auto rounded-2xl border-border bg-background shadow-2xl p-5 flex flex-col gap-4 max-h-[85vh]">
        <DialogHeader className="pb-0 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 text-foreground">
            <div className="p-1.5 bg-destructive/10 rounded-lg shrink-0">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            {t("ui.vault.forceDeleteModalTitle") || "强制物理删除数据"}
            {vault && (
              <span className="text-xs sm:text-sm text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full ml-1.5 truncate max-w-[200px]">
                {vault.vault}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/80 mt-1 leading-normal">
            {t("ui.vault.forceDeleteModalDesc") ||
              "在此输入路径关键字搜索该笔记本下的笔记和附件，并可强制从数据库和磁盘中永久删除数据。此操作不可恢复！"}
          </DialogDescription>
        </DialogHeader>

        {/* Search Input Area // 搜索输入区域 */}
        <div className="relative flex items-center shrink-0">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground/80 pointer-events-none" />
          <Input
            placeholder={t("ui.vault.searchPlaceholder") || "输入路径关键字进行搜索，例如: notes/work..."}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 pr-9 h-10 rounded-xl bg-muted/40 border-border/60 text-sm focus-visible:ring-destructive/30"
          />
          {keyword && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setKeyword("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results List Area // 搜索结果列表区域 */}
        <div className="flex-1 overflow-y-auto min-h-[250px] border border-border/60 rounded-xl bg-muted/10 p-2 space-y-1">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>{t("ui.vault.searching") || "正在搜索..."}</span>
            </div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-all gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`p-1.5 rounded-md shrink-0 border ${
                      item.type === "note"
                        ? "bg-primary/5 text-primary border-primary/20"
                        : "bg-amber-500/5 text-amber-500 border-amber-500/20"
                    }`}
                  >
                    {item.type === "note" ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </span>
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground/80 truncate">
                        {item.path}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded border border-border/40 font-mono shrink-0">
                        ID: {item.id}
                      </span>
                      {item.isRecycle && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 rounded font-bold shrink-0">
                          {t("ui.vault.recycleBin") || "回收站"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium flex-wrap">
                      <span>
                        {item.type === "note" ? t("ui.vault.note") || "笔记" : t("ui.vault.file") || "附件"}
                      </span>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="font-mono text-muted-foreground/75 truncate max-w-[260px]" title={item.pathHash}>
                        Hash: {item.pathHash}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteItem(item)}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("ui.common.delete") || "删除"}</span>
                </Button>
              </div>
            ))
          ) : keyword.trim() ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-muted-foreground text-xs leading-relaxed">
              <Search className="h-6 w-6 mb-2 text-muted-foreground/60" />
              <span>{t("ui.vault.noResults") || "未找到库中匹配的笔记或附件"}</span>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-muted-foreground text-xs leading-relaxed text-center px-4">
              <FileText className="h-7 w-7 mb-2 text-muted-foreground/50" />
              <p className="font-semibold text-foreground/70 mb-1">物理删除搜索工具</p>
              <p className="text-[11px] text-muted-foreground/80 max-w-[280px]">
                输入路径关键字进行搜索后，可以直接物理删除单个笔记或附件。此操作绕过回收站且不留存历史。
              </p>
            </div>
          )}
        </div>

        {/* Footer Area // 底部关闭按钮 */}
        <div className="flex justify-end shrink-0 pt-1 border-t border-border/40">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-9 text-xs font-semibold px-4 border-border/50"
          >
            {t("ui.common.close") || "关闭"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

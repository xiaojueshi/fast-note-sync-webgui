import { ShieldCheck, Smartphone, Monitor, RefreshCw, Trash2, Clock, Globe, ShieldAlert, Plus, Key, Copy, Check, Terminal, FileText, ChevronLeft, ChevronRight, History, Activity, MoreVertical, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { useTokenHandle, TokenLog } from "@/components/api-handle/token-handle";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React from "react";


interface TokenManagerProps {
  isCompact?: boolean;
  onCountChange?: (count: number) => void;
  onOnlineCountChange?: (count: number) => void;
}

export interface TokenManagerHandle {
  openCreate: () => void;
  refresh: () => void;
}

export const TokenManager = forwardRef<TokenManagerHandle, TokenManagerProps>(
  ({ isCompact, onCountChange, onOnlineCountChange }, ref) => {
    const { t } = useTranslation();
    const { tokens, isLoading, currentTokenID, handleListTokens, handleRevokeToken, handleCreateToken, handleUpdateToken, handleFetchTokenLogs } = useTokenHandle();

    useImperativeHandle(ref, () => ({
      openCreate: () => setIsCreateOpen(true),
      refresh: () => handleListTokens(),
    }));
    const [revokingId, setRevokingId] = useState<number | null>(null);

    // Token Log View State
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
    const [logs, setLogs] = useState<TokenLog[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [logPage, setLogPage] = useState(1);
    const [isLogLoading, setIsLogLoading] = useState(false);
    const LOG_PAGE_SIZE = 10;

    // Create/Edit token dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTokenId, setEditingTokenId] = useState<number | null>(null);

    const [newClientType, setNewClientType] = useState("Other");
    const [newProtocols, setNewProtocols] = useState<string[]>(["rest", "ws"]);
    const [newClientDim, setNewClientDim] = useState("*");
    const [newFuncDims, setNewFuncDims] = useState<string[]>([]); // Empty means "*"
    const [newExpiresDays, setNewExpiresDays] = useState(30);
    const [newBoundIp, setNewBoundIp] = useState("");
    const [newUserAgent, setNewUserAgent] = useState("");
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
      handleListTokens();
    }, [handleListTokens]);

    useEffect(() => {
      if (onCountChange) {
        onCountChange(tokens.length);
      }
      if (onOnlineCountChange) {
        const online = tokens.filter(t => t.isWsOnline).length;
        onOnlineCountChange(online);
      }
    }, [tokens, onCountChange, onOnlineCountChange]);

    const onRevoke = async (id: number) => {
      setRevokingId(id);
      const success = await handleRevokeToken(id);
      if (success) {
        toast.success(t("ui.token.revokeSuccess") || "Token revoked successfully");
      } else {
        toast.error(t("ui.token.revokeFailed") || "Failed to revoke token");
      }
      setRevokingId(null);
    };

    const onOpenLogs = (id: number) => {
      setSelectedTokenId(id);
      setLogPage(1);
      setIsLogOpen(true);
      fetchLogs(id, 1);
    };

    const onOpenEdit = (token: any) => {
      setEditingTokenId(token.id);
      setIsEditMode(true);
      setNewClientType(token.clientType);
      setNewBoundIp(token.boundIp);
      setNewUserAgent(token.userAgent);

      // Parse scope
      const parts = token.scope.split(" ");
      let p = ["rest", "ws"];
      let c = "*";
      let f = [] as string[];

      parts.forEach((part: string) => {
        if (part.startsWith("p:")) p = part.substring(2) === "*" ? [] : part.substring(2).split(",").filter(i => i);
        if (part.startsWith("c:")) c = part.substring(2);
        if (part.startsWith("f:")) f = part.substring(2) === "*" ? [] : part.substring(2).split(",").filter(i => i);
      });

      setNewProtocols(p);
      setNewClientDim(c);
      setNewFuncDims(f);

      // Expires: Calculate days from now
      const expiresAt = new Date(token.expiredAt);
      const diff = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      setNewExpiresDays(diff > 0 ? diff : 30);

      setIsCreateOpen(true);
    };

    const fetchLogs = async (id: number, page: number) => {
      setIsLogLoading(true);
      const res = await handleFetchTokenLogs(id, page, LOG_PAGE_SIZE);
      if (res) {
        setLogs(res.logs);
        setTotalLogs(res.pager.totalRows);
      }
      setIsLogLoading(false);
    };

    const onPageChange = (newPage: number) => {
      if (selectedTokenId) {
        setLogPage(newPage);
        fetchLogs(selectedTokenId, newPage);
      }
    };

    const onSubmitToken = async () => {
      const protocolStr = newProtocols.length === 0 ? "*" : newProtocols.join(",");
      const funcStr = newFuncDims.length === 0 ? "*" : newFuncDims.join(",");

      if (isEditMode && editingTokenId) {
        const success = await handleUpdateToken(
          editingTokenId,
          newClientType.trim(),
          "", // Scope is handled by components if needed, or leave blank to use dimensions
          newExpiresDays,
          newBoundIp.trim(),
          newUserAgent.trim(),
          protocolStr,
          newClientDim.trim(),
          funcStr
        );
        if (success) {
          toast.success(t("ui.common.success"));
          closeCreateDialog();
        } else {
          toast.error(t("ui.common.error"));
        }
      } else {
        const token = await handleCreateToken(
          newClientType.trim(),
          "",
          newExpiresDays,
          newBoundIp.trim(),
          newUserAgent.trim(),
          protocolStr,
          newClientDim.trim(),
          funcStr
        );
        if (token) {
          setGeneratedToken(token);
          handleListTokens();
          toast.success(t("ui.common.success"));
        } else {
          toast.error(t("ui.common.error"));
        }
      }
    };

    const handleCopy = useCallback(() => {
      if (generatedToken) {
        navigator.clipboard.writeText(generatedToken).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
          toast.success(t("ui.vault.copyConfigSuccess") || "Copied to clipboard");
        });
      }
    }, [generatedToken, t]);

    const closeCreateDialog = () => {
      setIsCreateOpen(false);
      setIsEditMode(false);
      setEditingTokenId(null);
      setGeneratedToken(null);
      setNewClientType("Other");
      setNewProtocols(["rest", "ws"]);
      setNewClientDim("*");
      setNewFuncDims([]);
      setNewExpiresDays(30);
      setNewBoundIp("");
      setNewUserAgent("");
    };

    const toggleProtocol = (p: string) => {
      setNewProtocols(prev =>
        prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]
      );
    };
    const toggleFuncDim = (f: string) => {
      setNewFuncDims(prev => {
        const isSelecting = !prev.includes(f);
        let next = isSelecting ? [...prev, f] : prev.filter(i => i !== f);

        if (isSelecting) {
          if (f.endsWith("_rw")) {
            const rVersion = f.replace("_rw", "_r");
            next = next.filter(i => i !== rVersion);
          } else if (f.endsWith("_r")) {
            const rwVersion = f.replace("_r", "_rw");
            next = next.filter(i => i !== rwVersion);
          }
        }
        return next;
      });
    };

    const getClientIcon = (clientType: string) => {
      const type = clientType.toLowerCase();
      if (type.includes("mobile") || type.includes("ios") || type.includes("android")) {
        return <Smartphone className="h-4 w-4" />;
      }
      return <Monitor className="h-4 w-4" />;
    };

    const parseScope = useCallback((scope: string) => {
      const parts = scope.split(" ");
      let protocols = [] as string[];
      let client = "*";
      let funcs = [] as string[];

      parts.forEach((part: string) => {
        if (part.startsWith("p:")) protocols = part.substring(2).split(",").filter(i => i);
        if (part.startsWith("c:")) client = part.substring(2);
        if (part.startsWith("f:")) funcs = part.substring(2) === "*" ? [] : part.substring(2).split(",").filter(i => i);
      });

      return { protocols, client, funcs };
    }, []);

    const getExpiryInfo = useCallback((createdAt: string, expiredAt: string) => {
      const start = new Date(createdAt).getTime();
      const end = new Date(expiredAt).getTime();
      const now = new Date().getTime();

      if (now >= end) return { percent: 100, isExpired: true, remainingDays: 0 };

      const total = end - start;
      const elapsed = now - start;
      const percent = Math.min(Math.max((elapsed / total) * 100, 0), 100);
      const remainingDays = Math.ceil((end - now) / (1000 * 3600 * 24));

      return { percent, isExpired: false, remainingDays };
    }, []);

    const getFuncLabel = (func: string) => {
      switch (func) {
        case "note_r": return t("ui.token.permNoteR");
        case "note_w":
        case "note_rw": return t("ui.token.permNoteRW");
        case "file_r": return t("ui.token.permFileR");
        case "file_w":
        case "file_rw": return t("ui.token.permFileRW");
        case "config_r": return t("ui.token.permConfigR");
        case "config_w":
        case "config_rw": return t("ui.token.permConfigRW");
        default: return func;
      }
    };

    return (
      <div className={cn("space-y-6", isCompact ? "animate-none" : "animate-in fade-in slide-in-from-bottom-4 duration-500")}>
        {!isCompact && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
                {t("ui.nav.menuTokens") || "令牌管理"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("ui.token.description") || "管理您的活动会话和 API 访问令牌。您可以随时注销不再使用的设备。"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleListTokens()}
                disabled={isLoading}
                className="rounded-xl"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCreateOpen(true)}
                className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
              </Button>

            </div>
          </div>
        )}




        <Dialog open={isCreateOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                {isEditMode ? (t("ui.token.editTitle") || "编辑令牌") : (t("ui.token.createTitle") || "创建新令牌")}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? (t("ui.token.editDesc") || "修改现有令牌的权限和有效期设置。") : (t("ui.token.createDesc") || "手动创建一个具有特定权限和有效期的 API 访问令牌。")}
              </DialogDescription>
            </DialogHeader>

            {!generatedToken ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 py-4">
                {/* 第一行：备注名称 和 客户端限制 */}
                <div className="space-y-2">
                  <Label htmlFor="clientType" className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    <span className="flex items-center gap-1">
                      {t("ui.token.name")}
                      <Tooltip content={t("ui.token.nameHelp")}>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                      </Tooltip>
                    </span>
                  </Label>
                  <Input
                    id="clientType"
                    value={newClientType}
                    onChange={(e) => setNewClientType(e.target.value)}
                    placeholder="e.g. Obsidian-Mobile, MyServer"
                    className="rounded-xl h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientDim" className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Smartphone className="h-3 w-3" />
                    <span className="flex items-center gap-1">
                      {t("ui.token.clientType")}
                      <Tooltip content={t("ui.token.clientTypeHelp")}>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                      </Tooltip>
                    </span>
                  </Label>
                  <Input
                    id="clientDim"
                    value={newClientDim}
                    onChange={(e) => setNewClientDim(e.target.value)}
                    placeholder="e.g. ObsidianPlugin, *"
                    className="rounded-xl h-9"
                  />
                </div>

                {/* 第二行：协议限制 和 有效期 */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Terminal className="h-3 w-3" />
                    <span className="flex items-center gap-1">
                      {t("ui.token.protocol")}
                      <Tooltip content={t("ui.token.protocolHelp")}>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                      </Tooltip>
                    </span>
                  </Label>
                  <div className="flex flex-wrap items-center gap-3 p-2 px-3 rounded-xl bg-muted/50 border border-border h-9">
                    {["rest", "ws", "mcp"].map((p) => (
                      <div key={p} className="flex items-center space-x-1.5">
                        <Checkbox
                          id={`p-${p}`}
                          checked={newProtocols.includes(p)}
                          onCheckedChange={() => toggleProtocol(p)}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`p-${p}`} className="capitalize cursor-pointer text-xs">{p}</Label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-1.5 border-l pl-3 border-border/50 h-4">
                      <Checkbox
                        id="p-all"
                        checked={newProtocols.length === 0}
                        onCheckedChange={(checked) => checked ? setNewProtocols([]) : setNewProtocols(["rest", "ws"])}
                        className="h-3.5 w-3.5"
                      />
                      <Label htmlFor="p-all" className="cursor-pointer font-bold text-xs">{t("ui.common.unrestricted") || "不限制"}</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires" className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {t("ui.token.expiresDays")}
                  </Label>
                  <Input
                    id="expires"
                    type="number"
                    value={newExpiresDays}
                    onChange={(e) => setNewExpiresDays(parseInt(e.target.value))}
                    className="rounded-xl h-9"
                  />
                </div>

                {/* 第三行：内容限制（全宽） */}
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="funcDim" className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" />
                    <span className="flex items-center gap-1">
                      {t("ui.token.function")}
                      <Tooltip content={t("ui.token.functionHelp")}>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                      </Tooltip>
                    </span>
                  </Label>
                  <div className="grid grid-cols-3 gap-y-3 gap-x-4 p-3 rounded-xl bg-muted/50 border border-border">
                    {/* Notes Column */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1 px-1 border-b border-border/30 pb-1">
                        {t("ui.vault.note")}
                      </div>
                      {[
                        { id: "note_r", label: t("ui.token.funcNoteR") },
                        { id: "note_rw", label: t("ui.token.funcNoteRW") },
                      ].map((opt) => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`f-${opt.id}`}
                            checked={newFuncDims.includes(opt.id)}
                            onCheckedChange={() => toggleFuncDim(opt.id)}
                            className="h-3.5 w-3.5"
                          />
                          <Label htmlFor={`f-${opt.id}`} className="cursor-pointer text-[11px] truncate" title={opt.label}>{opt.label.includes(' - ') ? opt.label.split(' - ')[1] : opt.label}</Label>
                        </div>
                      ))}
                    </div>

                    {/* Files Column */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1 px-1 border-b border-border/30 pb-1">
                        {t("ui.file.file")}
                      </div>
                      {[
                        { id: "file_r", label: t("ui.token.funcFileR") },
                        { id: "file_rw", label: t("ui.token.funcFileRW") },
                      ].map((opt) => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`f-${opt.id}`}
                            checked={newFuncDims.includes(opt.id)}
                            onCheckedChange={() => toggleFuncDim(opt.id)}
                            className="h-3.5 w-3.5"
                          />
                          <Label htmlFor={`f-${opt.id}`} className="cursor-pointer text-[11px] truncate" title={opt.label}>{opt.label.includes(' - ') ? opt.label.split(' - ')[1] : opt.label}</Label>
                        </div>
                      ))}
                    </div>

                    {/* Config Column */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1 px-1 border-b border-border/30 pb-1">
                        {t("ui.nav.menuSettings")}
                      </div>
                      {[
                        { id: "config_r", label: t("ui.token.funcConfigR") },
                        { id: "config_rw", label: t("ui.token.funcConfigRW") },
                      ].map((opt) => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`f-${opt.id}`}
                            checked={newFuncDims.includes(opt.id)}
                            onCheckedChange={() => toggleFuncDim(opt.id)}
                            className="h-3.5 w-3.5"
                          />
                          <Label htmlFor={`f-${opt.id}`} className="cursor-pointer text-[11px] truncate" title={opt.label}>{opt.label.includes(' - ') ? opt.label.split(' - ')[1] : opt.label}</Label>
                        </div>
                      ))}
                    </div>

                    <div className="col-span-3 border-t border-border/50 pt-2 mt-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="f-all"
                          checked={newFuncDims.length === 0}
                          onCheckedChange={(checked) => checked ? setNewFuncDims([]) : setNewFuncDims(["note_r"])}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor="f-all" className="cursor-pointer font-bold text-[11px]">{t("ui.common.unrestricted")}</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 第四行：限制 IP 和 限制 UA */}
                <div className="space-y-1.5">
                  <Label htmlFor="boundIp" className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    {t("ui.token.boundIp")}
                  </Label>
                  <Input
                    id="boundIp"
                    value={newBoundIp}
                    onChange={(e) => setNewBoundIp(e.target.value)}
                    placeholder="e.g. 127.0.0.1"
                    className="rounded-xl h-9"
                  />
                  <p className="text-[10px] text-muted-foreground/70 px-1 italic">
                    {t("ui.token.ipWildcardHint")}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="userAgent" className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    {t("ui.token.userAgent")}
                  </Label>
                  <Input
                    id="userAgent"
                    value={newUserAgent}
                    onChange={(e) => setNewUserAgent(e.target.value)}
                    placeholder="e.g. Mozilla..."
                    className="rounded-xl h-9"
                  />
                  <p className="text-[10px] text-muted-foreground/70 px-1 italic">
                    {t("ui.token.uaWildcardHint")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <p>{t("ui.token.warning") || "请务必复制并妥善保存此令牌。出于安全原因，它将不会再次显示。"}</p>
                </div>
                <div className="relative group">
                  <div className="p-4 rounded-xl bg-muted font-mono text-sm break-all pr-12 border border-border">
                    {generatedToken}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-2 h-8 w-8 rounded-lg"
                    onClick={handleCopy}
                  >
                    {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              {!generatedToken ? (
                <>
                  <Button variant="ghost" onClick={closeCreateDialog} className="rounded-xl">
                    {t("ui.common.cancel")}
                  </Button>
                  <Button onClick={onSubmitToken} disabled={isLoading} className="rounded-xl px-8">
                    {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    {t("ui.common.confirm")}
                  </Button>
                </>
              ) : (
                <Button onClick={closeCreateDialog} className="rounded-xl w-full">
                  {t("ui.common.close")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4">
          {tokens.length === 0 && !isLoading ? (
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">{t("ui.token.noTokens") || "暂无活动令牌"}</p>
              </CardContent>
            </Card>
          ) : (
            tokens.map((token) => {
              const { protocols, funcs } = parseScope(token.scope);
              const expiry = getExpiryInfo(token.createdAt, token.expiredAt);
              const isSelf = token.id === currentTokenID;

              return (
                <Card key={token.id} className={cn(
                  "group relative overflow-hidden transition-all duration-300 border-border/40 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                  expiry.isExpired ? "opacity-60 bg-muted/20" : "bg-card/50"
                )}>
                  {/* 顶部背景装饰 */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1 transition-all duration-500",
                    expiry.isExpired ? "bg-muted" :
                      isSelf ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                        token.issueType === 2 ? "bg-gradient-to-r from-blue-500 to-blue-600" :
                          "bg-gradient-to-r from-primary/40 to-primary"
                  )} />

                  <CardContent className="p-5 space-y-4">
                    {/* 头部：图标 + 标题 + 状态 */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 duration-300",
                          expiry.isExpired ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        )}>
                          {token.issueType === 1 ? (
                            <Globe className="h-5 w-5" />
                          ) : (
                            getClientIcon(token.clientType)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base truncate max-w-[150px]">{token.clientType}</h3>
                            {isSelf && (
                              <Badge className="h-5 text-[10px] px-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                                {t("ui.token.current")}
                              </Badge>
                            )}
                            {token.isWsOnline && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-1.5 py-0.5 rounded-md border border-emerald-500/10">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                {t("ui.token.wsOnline")}
                              </div>
                            )}
                            <div className="flex gap-1">
                              {protocols.map(p => (
                                <Badge key={p} variant="outline" className="h-4 text-[9px] px-1 font-bold uppercase border-primary/20 text-primary bg-primary/5">
                                  {p === "*" ? t("ui.token.anyProtocol") : p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0">
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal bg-primary/5 text-primary/70 border-primary/10">
                                ID: {token.id}
                              </Badge>
                              <Badge variant="outline" className={cn(
                                "text-[10px] h-4 px-1.5 font-normal flex items-center gap-1",
                                token.issueType === 1 ? "bg-blue-500/5 text-blue-600/70 border-blue-500/10" : "bg-purple-500/5 text-purple-600/70 border-purple-500/10"
                              )}>
                                {token.issueType === 1 ? <Globe className="h-3 w-3" /> : React.cloneElement(getClientIcon(token.clientType) as React.ReactElement<{ className?: string }>, { className: "h-3 w-3" })}
                                {token.issueType === 1 ? t("ui.token.issueTypeLogin") : t("ui.token.issueTypeManual")}
                              </Badge>
                            </span>

                            {/* 权限 Scope 详情 */}
                            <div className="flex flex-wrap gap-1 items-center">
                              {funcs.length === 0 ? (
                                <Badge variant="outline" className="h-4 text-[9px] px-1 font-medium bg-muted text-muted-foreground border-border">{t("ui.token.unrestrictedFunc")}</Badge>
                              ) : (
                                funcs.map(f => (
                                  <Badge key={f} variant="outline" className="h-4 text-[9px] px-1 font-medium bg-sky-500/5 text-sky-600 border-sky-500/20">{getFuncLabel(f)}</Badge>
                                ))
                              )}

                              {token.boundIp && token.boundIp !== "*" && (
                                <Badge variant="outline" className="h-4 text-[9px] px-1 font-medium border-amber-500/20 text-amber-600 bg-amber-500/5 whitespace-nowrap">
                                  {t("ui.token.ipRestriction")}: {token.boundIp}
                                </Badge>
                              )}

                              {token.userAgent && token.userAgent !== "*" && (
                                <Tooltip content={token.userAgent}>
                                  <Badge variant="outline" className="h-4 text-[9px] px-1 font-medium border-indigo-500/20 text-indigo-600 bg-indigo-500/5 cursor-help">
                                    {t("ui.token.uaRestriction")}
                                  </Badge>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem onClick={() => onOpenLogs(token.id)} className="gap-2 cursor-pointer">
                              <History className="h-4 w-4" />
                              {t("ui.token.logsTitle")}
                            </DropdownMenuItem>
                            {token.issueType === 2 && (
                              <DropdownMenuItem onClick={() => onOpenEdit(token)} className="gap-2 cursor-pointer">
                                <FileText className="h-4 w-4" />
                                {t("ui.common.edit")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onRevoke(token.id)}
                              disabled={isSelf || revokingId === token.id}
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("ui.common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>


                    {/* 最后使用与有效期 */}
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 truncate">
                        <Activity className="h-3 w-3" />
                        <span>{t("ui.token.lastUsedAt")}:</span>
                        <span className="font-medium">
                          {token.lastUsedAt && !token.lastUsedAt.startsWith("0001") ? new Date(token.lastUsedAt).toLocaleString() : t("ui.common.never")}
                        </span>
                        {token.lastUsedAt && !token.lastUsedAt.startsWith("0001") && (new Date().getTime() - new Date(token.lastUsedAt).getTime() < 5 * 60 * 1000) && (
                          <span className="text-emerald-500  ml-1 animate-pulse">
                            {t("ui.token.recentUse")}
                          </span>
                        )}
                      </div>
                      <Tooltip
                        content={
                          <div className="space-y-1 p-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">{t("ui.common.createdAt")}:</span>
                              <span className="font-mono">{new Date(token.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">{t("ui.token.expiresAt")}:</span>
                              <span className="font-mono">{new Date(token.expiredAt).toLocaleString()}</span>
                            </div>
                          </div>
                        }
                      >
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] font-bold shrink-0 cursor-help",
                          expiry.isExpired ? "text-destructive" : expiry.percent > 90 ? "text-destructive" : expiry.percent > 70 ? "text-amber-500" : "text-emerald-500"
                        )}>
                          <Clock className="h-3 w-3" />
                          {expiry.isExpired ? t("ui.token.statusExpired") : `${expiry.remainingDays}${t("ui.token.daysRemaining")}`}
                        </div>
                      </Tooltip>
                    </div>

                  </CardContent>
                </Card>
              );
            })
          )}
        </div>


        <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
          <DialogContent className="sm:max-w-[800px] rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                {t("ui.token.logsTitle") || "访问日志"}
              </DialogTitle>
              <DialogDescription>
                {tokens.find(t => t.id === selectedTokenId)?.clientType} - {t("ui.token.logsDesc") || "查看该令牌的最近访问记录"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto py-4">
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[160px] text-[11px] uppercase tracking-wider font-bold">{t("ui.token.logTime")}</TableHead>
                      <TableHead className="w-[80px] text-[11px] uppercase tracking-wider font-bold">{t("ui.token.logProtocol") || "协议"}</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-bold">{t("ui.token.logClient")}</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-bold">{t("ui.token.logIp")}</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-bold">{t("ui.token.logUa")}</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-bold text-center">{t("ui.token.logStatus")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLogLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground/30" />
                        </TableCell>
                      </TableRow>
                    ) : (logs?.length || 0) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                          {t("ui.common.noData") || "暂无日志记录"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs?.map((log) => (
                        <TableRow key={log.id} className="group hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 h-4 w-fit border-primary/20 text-primary bg-primary/5">
                              {log.protocol}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="text-xs font-bold text-foreground/90">{log.clientName || "Unknown"}</span>
                              <span className="text-[11px] text-muted-foreground font-medium">{log.client}</span>
                              {log.clientVersion && (
                                <span className="text-[10px] text-muted-foreground/50 font-mono">v{log.clientVersion}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{log.ip}</TableCell>
                          <TableCell>
                            <div className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]" title={log.ua}>
                              {log.ua}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "text-xs font-bold",
                              log.statusCode >= 200 && log.statusCode < 300 ? "text-emerald-500" : "text-destructive"
                            )}>{log.statusCode}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4">
              <div className="text-xs text-muted-foreground">
                Total {totalLogs} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onPageChange(logPage - 1)}
                  disabled={logPage <= 1 || isLogLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium px-2">
                  {logPage} / {Math.ceil(totalLogs / LOG_PAGE_SIZE) || 1}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onPageChange(logPage + 1)}
                  disabled={logPage >= Math.ceil(totalLogs / LOG_PAGE_SIZE) || isLogLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  });

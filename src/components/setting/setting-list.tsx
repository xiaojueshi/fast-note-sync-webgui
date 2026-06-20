import { Pencil, Trash2, TextCursorInput, Clock, ChevronLeft, ChevronRight, FileCode, FileJson, FileType, FileText, Image as ImageIcon, FileBox } from "lucide-react";
import { useConfirmDialog } from "@/components/context/confirm-dialog-context";
import { useSettingHandle } from "@/components/api-handle/setting-handle";
import { useState, useEffect, useCallback, useMemo } from "react";
import { markdown } from "@codemirror/lang-markdown";
import { Tooltip } from "@/components/ui/tooltip";
import { SettingItem } from "@/lib/types/setting";
import { Button } from "@/components/ui/button";
import CodeMirror from "@uiw/react-codemirror";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { EditorView } from "@codemirror/view";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";



interface SettingListProps {
    vault: string;
    searchKeyword: string;
    currentPage: number;
    onPageChange: (page: number) => void;
    refreshSignal: number;
    onRegisterAdd: (onAdd: () => void) => void;
}

export function SettingList({ 
    vault, 
    searchKeyword, 
    currentPage, 
    onPageChange, 
    refreshSignal,
    onRegisterAdd
}: SettingListProps) {
    const { t } = useTranslation();
    const { handleSettingList, handleSaveSetting, handleDeleteSetting, handleRenameSetting } = useSettingHandle();
    const { openConfirmDialog } = useConfirmDialog();

    const [settings, setSettings] = useState<SettingItem[]>([]);
    const [loading, setLoading] = useState(false);

    // 分页状态
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 20;

    const fetchSettings = useCallback(() => {
        if (!vault) return;
        setLoading(true);
        handleSettingList(vault, (data) => {
            setSettings(data.list || []);
            setTotalItems(data.pager?.totalRows || 0);
            setLoading(false);
        }, () => {
            setLoading(false);
        }, searchKeyword, currentPage, pageSize);
    }, [handleSettingList, vault, searchKeyword, currentPage]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings, refreshSignal]);

    const filteredSettings = settings;

    const getLanguageExtension = (_path: string) => {
        // 使用已有的 markdown 扩展，它对于 json/js 也提供不错的基础支持
        return [markdown()];
    };

    const onAdd = useCallback(() => {
        let path = "";
        let content = "";

        const EditorWrapper = ({ initialPath }: { initialPath: string }) => {
            const [currentPath, setCurrentPath] = useState(initialPath);
            const extensions = useMemo(() => getLanguageExtension(currentPath), [currentPath]);

            return (
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("ui.settingsBrowser.key")}</label>
                        <Input
                            autoFocus
                            placeholder="e.g. system/config.json"
                            onChange={(e) => {
                                path = e.target.value;
                                setCurrentPath(e.target.value);
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("ui.settingsBrowser.content")}</label>
                        <div className="border border-border rounded-xl overflow-hidden min-h-[300px] focus-within:ring-2 focus-within:ring-primary/20">
                            <CodeMirror
                                height="300px"
                                theme="dark"
                                extensions={[...extensions, EditorView.lineWrapping]}
                                onChange={(value) => { content = value; }}
                                basicSetup={{
                                    lineNumbers: true,
                                    foldGutter: true,
                                    dropCursor: true,
                                    allowMultipleSelections: true,
                                    indentOnInput: true,
                                    bracketMatching: true,
                                    closeBrackets: true,
                                    highlightActiveLine: true,
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        };

        openConfirmDialog(
            t("ui.settingsBrowser.add"),
            "confirm",
            () => {
                if (!path) return;
                handleSaveSetting(vault, { path, content }, fetchSettings);
            },
            <EditorWrapper initialPath="" />,
            "max-w-3xl"
        );
    }, [vault, fetchSettings, openConfirmDialog, t, handleSaveSetting]);

    useEffect(() => {
        onRegisterAdd(onAdd);
    }, [onAdd, onRegisterAdd]);

    const onEdit = (item: SettingItem) => {
        let content = item.content;
        const extensions = getLanguageExtension(item.path);

        openConfirmDialog(
            t("ui.settingsBrowser.edit") + ": " + item.path,
            "confirm",
            () => {
                handleSaveSetting(vault, { ...item, content }, fetchSettings);
            },
            <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">{t("ui.settingsBrowser.content")}</label>
                <div className="border border-border rounded-xl overflow-hidden min-h-[450px] focus-within:ring-2 focus-within:ring-primary/20">
                    <CodeMirror
                        autoFocus
                        value={item.content}
                        height="450px"
                        theme="dark"
                        extensions={[...extensions, EditorView.lineWrapping]}
                        onChange={(value) => { content = value; }}
                        basicSetup={{
                            lineNumbers: true,
                            foldGutter: true,
                            dropCursor: true,
                            allowMultipleSelections: true,
                            indentOnInput: true,
                            bracketMatching: true,
                            closeBrackets: true,
                            highlightActiveLine: true,
                        }}
                    />
                </div>
            </div>,
            "max-w-4xl"
        );
    };

    const onRename = (item: SettingItem) => {
        let newPath = item.path;
        openConfirmDialog(
            t("ui.settingsBrowser.rename"),
            "confirm",
            () => {
                if (!newPath || newPath === item.path) return;
                handleRenameSetting(vault, item.path, newPath, item.pathHash, fetchSettings);
            },
            <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">{t("ui.settingsBrowser.newKey")}</label>
                <Input
                    autoFocus
                    defaultValue={item.path}
                    onChange={(e) => { newPath = e.target.value; }}
                />
            </div>
        );
    };

    const onDelete = (item: SettingItem) => {
        openConfirmDialog(
            t("ui.settingsBrowser.confirmDelete", { key: item.path }),
            "confirm",
            () => {
                handleDeleteSetting(vault, item.path, item.pathHash, fetchSettings);
            }
        );
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'json':
                return <FileJson className="h-4 w-4 text-orange-500/70" />;
            case 'js':
            case 'ts':
            case 'jsx':
            case 'tsx':
                return <FileCode className="h-4 w-4 text-blue-500/70" />;
            case 'css':
            case 'scss':
            case 'less':
                return <FileType className="h-4 w-4 text-pink-500/70" />;
            case 'md':
            case 'txt':
                return <FileText className="h-4 w-4 text-emerald-500/70" />;
            case 'yml':
            case 'yaml':
                return <FileBox className="h-4 w-4 text-purple-500/70" />;
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'svg':
            case 'webp':
                return <ImageIcon className="h-4 w-4 text-indigo-500/70" />;
            default:
                return <FileText className="h-4 w-4 text-primary/70" />;
        }
    };

    return (
        <div className="w-full flex flex-col space-y-4">
            {/* List Content */}
            {loading && settings.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-24 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">{t("ui.common.loading")}</p>
                </div>
            ) : filteredSettings.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-24 text-center">
                    <div className="p-4 rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <FileJson className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-foreground">{t("ui.settingsBrowser.noSettings")}</p>
                </div>
            ) : (
                <>
                    {/* Table Layout - Exactly like Sync Logs */}
                    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="min-w-[300px] py-4"><div className="flex items-center gap-2 px-2"><FileType className="h-3.5 w-3.5 text-muted-foreground" /> {t("ui.settingsBrowser.key")}</div></TableHead>
                                    <TableHead className="w-[120px] py-4"><div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> {t("ui.settingsBrowser.value")}</div></TableHead>
                                    <TableHead className="w-[180px] py-4"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> {t("ui.common.updatedAt")}</div></TableHead>
                                    <TableHead className="w-[150px] py-4 text-right px-6">{t("ui.common.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSettings.map((item) => {
                                    const pathParts = item.path.split('/');
                                    const fileName = pathParts.pop() || "";
                                    const dirPath = pathParts.join('/');

                                    return (
                                        <TableRow key={item.pathHash || item.path} className="group hover:bg-muted/30 transition-colors border-border/40">
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                        {getFileIcon(fileName)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            {dirPath && <span className="text-muted-foreground/60">{dirPath}/</span>}
                                                            <span className="font-bold text-foreground">{fileName}</span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground/40 font-mono truncate max-w-[200px]">
                                                            {item.pathHash}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="px-2 py-0.5 rounded bg-muted/40 text-[10px] font-mono text-muted-foreground inline-block">
                                                    {formatSize(item.content?.length || 0)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-xs text-muted-foreground">
                                                {(item.updatedAt || item.createdAt) && format(new Date(item.updatedAt || item.createdAt || ""), "yyyy-MM-dd HH:mm")}
                                            </TableCell>
                                            <TableCell className="py-3 text-right px-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Tooltip content={t("ui.settingsBrowser.rename")} side="top">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all" onClick={() => onRename(item)}>
                                                            <TextCursorInput className="h-4 w-4" />
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip content={t("ui.common.edit")} side="top">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all" onClick={() => onEdit(item)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip content={t("ui.common.delete")} side="top">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => onDelete(item)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-xl"
                                disabled={currentPage === 1 || loading}
                                onClick={() => onPageChange(currentPage - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1 px-4 py-1.5 bg-muted/50 rounded-xl border border-border/50 shadow-inner">
                                <span className="text-sm font-semibold">{currentPage}</span>
                                <span className="text-sm text-muted-foreground">/</span>
                                <span className="text-sm text-muted-foreground">{totalPages}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-xl"
                                disabled={currentPage === totalPages || loading}
                                onClick={() => onPageChange(currentPage + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

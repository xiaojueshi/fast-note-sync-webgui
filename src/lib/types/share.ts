// 对应 dto.ShareListItem
export interface ShareItem {
  id: number
  uid: number
  title: string           // 资源标题（笔记标题或文件名）
  url: string             // 分享链接路径，例如 /share/resID/token
  res: Record<string, string[]>
  status: number          // 1: active, 2: cancelled
  notePath?: string       // note path, for share filter matching in note list
  vaultName?: string      // vault name the note belongs to, for per-vault count filtering
  shortLink?: string
  viewCount?: number
  isPassword?: boolean
  lastViewedAt?: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  baseUrl?: string
}

// 对应 dto.ShareListResponse (data 部分)
export interface ShareListResponse {
  list: ShareItem[]
  pager: {
    page: number
    pageSize: number
    totalRows: number
  }
}

// 对应 dto.ShareCreateResponse（创建分享 / 按路径查询单个分享的响应）
export interface ShareCreateResponse {
  id: number
  token: string
  type: string            // "note" | "file"
  url?: string            // 分享链接路径
  shortLink?: string
  isPassword?: boolean
  expiresAt: string
  baseUrl?: string
}

import { Pen, Plus, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useUsers } from "../api-handle/user-users"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { CreateUser } from "@/components/user/create-form"
import { UserInfo } from "@/lib/types/user"
import { EditUser } from "../user/edit-form"
import { cn } from "@/lib/utils"
import { Tooltip } from "@/components/ui/tooltip"
import { Badge } from "../ui/badge"

export function UserManagment() {
  const { t } = useTranslation()
  const { users, isLoading, error, refresh } = useUsers()
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState<UserInfo | null>(null)

  const onUserUpdated = () => {
    setEditUserOpen(null)
    refresh()
  }

  const onUserCreated = (needRefresh: boolean) => {
    setCreateUserOpen(false)
    if (needRefresh) {
      refresh()
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 custom-shadow">
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{t("ui.users.createUser")}</DialogTitle>
          </DialogHeader>
          <CreateUser onClose={onUserCreated} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={editUserOpen != null}
        onOpenChange={() => setEditUserOpen(null)}
      >
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{t("ui.users.editUser")}</DialogTitle>
          </DialogHeader>
          {editUserOpen && (
            <EditUser user={editUserOpen} onClose={onUserUpdated} />
          )}
        </DialogContent>
      </Dialog>
      <div className="flex justify-between">
        <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("ui.users.userManagment")}
        </h2>
        <Button
          onClick={() => {
            setCreateUserOpen(true)
          }}
          className="rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("ui.common.add")}
        </Button>
      </div>
      {isLoading && (
        <div className="p-8 text-center">{t("ui.common.loading")}</div>
      )}
      {error && <div className="p-8 text-center">{error}</div>}
      {!error && (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">{t("ui.users.userUid")}</TableHead>
                <TableHead className="w-20">
                  {t("ui.users.user")}
                </TableHead>
                <TableHead className="text-center">{t("ui.common.updatedAt")}</TableHead>
                <TableHead className="text-center">{t("ui.common.createdAt")}</TableHead>
                <TableHead className="text-center">{t("ui.users.userStatus")}</TableHead>
                <TableHead className="text-center">
                  {t("ui.common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.uid}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    user.isDeleted ? "bg-muted/90" : "",
                  )}
                >
                  <TableCell className="font-mono">{user.uid}</TableCell>
                  <TableCell>
                    <div  className="flex gap-4">
                    <button
                      className="size-9 rounded-full bg-muted flex items-center justify-center transition-all duration-200 ring-2 ring-ring/30 hover:ring-ring/50 focus-visible:outline-none focus-visible:ring-ring"
                      aria-label={t("ui.settings.userUid", { uid: user.uid })}
                    >
                      <span className="text-sm font-medium text-muted-foreground">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </button>
                    <div>
                      <div>{user.username}</div>
                      <div>{user.email}</div>
                    </div></div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center">
                    <Tooltip content={new Date(user.createdAt).toLocaleString()}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center">
                    <Tooltip content={new Date(user.updatedAt).toLocaleString()}>
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </Tooltip>
                  </TableCell>
                  <TableCell className="flex justify-center">
                    <Badge variant={user.isDeleted ? 'destructive' : 'outline'} className="text-[10px] font-normal opacity-70">
                         {user.isDeleted ? t("ui.users.userStatusBlocked") : t("ui.users.userStatusActive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl shrink-0"
                      onClick={() => {
                        setEditUserOpen(user)
                      }}
                      title={t("ui.common.delete")}
                    >
                      <Pen className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

import { addCacheBuster } from "@/lib/utils/cache-buster"
import { buildApiHeaders } from "@/lib/utils/api-headers"
import { toast } from "@/components/common/Toast"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { UserInfo } from "@/lib/types/user"
import { Checkbox } from "@/components/ui/checkbox"
import { createEditSchema, EditFormData } from "@/lib/validations/user-schema"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import env from "@/env.ts"

export function EditUser({
  user,
  onClose,
}: {
  user: UserInfo
  onClose: (needRefresh: boolean) => void
}) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const editSchema = createEditSchema(t)

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      password: "",
      isDeleted: user.isDeleted,
    },
  })

  const handleSubmit = async (data: EditFormData) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        addCacheBuster(env.API_URL + "/api/admin/users/update"),
        {
          method: "POST",
          headers: buildApiHeaders({
            token,
            includeDomain: false,
            includeContentType: true,
          }),
          body: JSON.stringify({
            ...data,
            uid: user.uid,
          }),
        },
      )

      const res = await response.json()

      if (res.status === true) {
        toast.success(res.message || t("ui.common.success"))
        onClose(true)
      } else {
        toast.error(res.details || res.message || t("ui.common.error"))
      }
    } catch {
      toast.error(t("ui.common.error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={editForm.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userName">{t("ui.auth.username")}</Label>
        <Input id="userName" {...editForm.register("username")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("ui.auth.email")}</Label>
        <Input id="email" type="email" {...editForm.register("email")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("ui.auth.password")}</Label>
        <Input
          id="password"
          type="password"
          {...editForm.register("password")}
        />
        <div className="text-xs text-muted-foreground">{ t("ui.users.userPasswordHint") }</div>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Controller
            control={editForm.control}
            name="isDeleted"
            render={({ field }) => (
              <Checkbox
                id="isDeleted"
                checked={field.value}
                onCheckedChange={field.onChange}
                ref={field.ref}
              />
            )}
          />
          <Label
            htmlFor="isDeleted"
            className="text-sm font-medium text-foreground"
          >
            {t("ui.users.userStatusBlocked")}
          </Label>
        </div>
        <div className="text-xs text-muted-foreground">{ t("ui.users.userBlockedHint") }</div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onClose(false)
          }}
        >
          {t("ui.common.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {t("ui.common.save")}
        </Button>
      </div>
    </form>
  )
}

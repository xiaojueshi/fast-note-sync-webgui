import { addCacheBuster } from "@/lib/utils/cache-buster"
import { buildApiHeaders } from "@/lib/utils/api-headers"
import { toast } from "@/components/common/Toast"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import env from "@/env.ts"
import {
  createRegisterSchema,
  RegisterFormData,
} from "@/lib/validations/user-schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

export function CreateUser({
  onClose,
}: {
  onClose: (needRefresh: boolean) => void
}) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const registerSchema = createRegisterSchema(t)

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const handleSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      const response = await fetch(
        addCacheBuster(env.API_URL + "/api/admin/users/create"),
        {
          method: "POST",
          headers: buildApiHeaders({
            token,
            includeDomain: false,
            includeContentType: true,
          }),
          body: JSON.stringify(data),
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
    <form
      onSubmit={registerForm.handleSubmit(handleSubmit)}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="userName">{t("ui.auth.username")}</Label>
        <Input id="userName" {...registerForm.register("username")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("ui.auth.email")}</Label>
        <Input id="email" type="email" {...registerForm.register("email")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("ui.auth.password")}</Label>
        <Input
          id="password"
          type="password"
          {...registerForm.register("password")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {t("ui.auth.confirmNewPassword")}
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          {...registerForm.register("confirmPassword")}
        />
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

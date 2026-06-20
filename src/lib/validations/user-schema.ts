import * as z from "zod"


const passwordValidation = (t: (key: string) => string) => z.string().min(6, t("ui.auth.passwordMinLength"))

// 登录表单验证
export const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    credentials: z.string().min(1, t("ui.auth.credentialsRequired")),
    password: passwordValidation(t),
    remember: z.coerce.boolean().optional().default(false),
  })

// 注册表单验证
export const createRegisterSchema = (t: (key: string) => string) =>
  z.object({
    username: z.string().min(3, t("ui.auth.usernameMinLength")),
    email: z.string().email(t("ui.auth.emailInvalid")),
    password: passwordValidation(t),
    confirmPassword: z.string().min(6, t("ui.auth.passwordMinLength")),
  })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("ui.auth.passwordMismatch"),
      path: ["confirmPassword"],
    })

// Edit user schema
export const createEditSchema = (t: (key: string) => string) =>
  z.object({
    username: z.string().min(3, t("ui.auth.usernameMinLength")),
    email: z.string().email(t("ui.auth.emailInvalid")),
    password: passwordValidation(t).or(z.literal("")),
    isDeleted: z.coerce.boolean().optional().default(false),
  })

// EditFormData
export type EditFormData = {
  username: string
  email: string
  password: string
  isDeleted: boolean
}

// 定义 LoginFormData 类型
export type LoginFormData = {
  credentials: string
  password: string
  remember: boolean
}

// 定义 RegisterFormData 类型
export type RegisterFormData = {
  username: string
  email: string
  password: string
  confirmPassword: string
}


export const changePasswdSchema = z.object({
  oldPassword: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
})

export type ChangePasswdFormData = z.infer<typeof changePasswdSchema>

export interface ChangePassword {
  oldPassword?: string
  password?: string
  confirmPassword?: string
}

export interface UserInfo {
  uid: number
  avatar: string
  username: string
  email: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

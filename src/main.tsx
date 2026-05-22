import "@/i18n/translations";
import "@/app/globals.css";

import { ConfirmDialogProvider } from "@/components/context/confirm-dialog-context";
import { ThemeProvider } from "@/components/context/theme-context";
import { Toaster } from "@/components/ui/sonner";
import ReactDOM from "react-dom/client";
import React from "react";

import { AuthProvider } from "./components/context/auth-context";
import App from "./App";


// 初始化配色方案
const initColorScheme = () => {
  const stored = localStorage.getItem('app-settings')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.colorScheme) {
        document.documentElement.setAttribute('data-color-scheme', state.colorScheme)
      }
    } catch {
      // 忽略解析错误
    }
  }
}
initColorScheme()

// 主题动态图标自适应
const initAdaptiveFavicon = () => {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const updateFavicon = (isDark: boolean) => {
    const iconPath = isDark ? '/static/images/icon.svg' : '/static/images/icon-black.svg'
    const selectors = [
      "link[rel='icon']",
      "link[rel='shortcut icon']",
      "link[rel='apple-touch-icon']",
      "link[rel='apple-touch-icon-precomposed']"
    ]

    selectors.forEach(selector => {
      const links = document.querySelectorAll(selector)
      links.forEach(link => {
        const newLink = link.cloneNode(true) as HTMLLinkElement
        newLink.href = iconPath
        link.parentNode?.replaceChild(newLink, link)
      })
    })
  }

  // 初始设置
  updateFavicon(darkModeMediaQuery.matches)

  // 监听系统主题切换事件
  try {
    darkModeMediaQuery.addEventListener('change', (e) => updateFavicon(e.matches))
  } catch (_e) {
    // 兼容旧版浏览器 (iOS < 14 等)
    darkModeMediaQuery.addListener((e) => updateFavicon(e.matches))
  }
}
initAdaptiveFavicon()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <ConfirmDialogProvider>
          <App />
          <Toaster />
        </ConfirmDialogProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)

import "@/i18n/translations";
import "@/app/globals.css";

import { ThemeProvider } from "@/components/context/theme-context";
import { Toaster } from "@/components/ui/sonner";
import ReactDOM from "react-dom/client";
import React from "react";

import { OAuthAuthorizeApp } from "@/app/OAuthAuthorizeApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="auto">
      <OAuthAuthorizeApp />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);

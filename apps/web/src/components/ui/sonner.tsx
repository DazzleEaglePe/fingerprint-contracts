"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "#040f0a",
          "--normal-text": "#f8fafc",
          "--normal-border": "rgba(16, 185, 129, 0.3)",
          "--success-bg": "rgba(16, 185, 129, 0.1)",
          "--success-border": "rgba(16, 185, 129, 0.4)",
          "--success-text": "#34d399",
          "--error-bg": "rgba(239, 68, 68, 0.1)",
          "--error-border": "rgba(239, 68, 68, 0.4)",
          "--error-text": "#f87171",
          "--warning-bg": "rgba(245, 158, 11, 0.1)",
          "--warning-border": "rgba(245, 158, 11, 0.4)",
          "--warning-text": "#fbbf24",
          "--info-bg": "rgba(59, 130, 246, 0.1)",
          "--info-border": "rgba(59, 130, 246, 0.4)",
          "--info-text": "#60a5fa",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#040f0a] group-[.toaster]:text-slate-50 group-[.toaster]:border-emerald-900/30 group-[.toaster]:shadow-2xl backdrop-blur-xl font-sans",
          description: "group-[.toast]:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-emerald-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

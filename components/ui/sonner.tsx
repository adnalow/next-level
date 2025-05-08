"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group z-[9999]"
      toastOptions={{
        className: "bg-[#232323] border border-[#ff8800] text-white rounded-md shadow-lg px-4 py-3 font-semibold text-base flex items-center gap-3",
        style: {
          background: '#232323',
          color: '#fff',
          border: '1px solid #ff8800',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.25)',
        },
        descriptionClassName: "text-gray-300 font-normal text-sm mt-1",
        actionButtonClassName: "bg-[#ff8800] text-black font-bold rounded px-3 py-1 ml-2 hover:bg-[#ffa733] transition-colors",
        cancelButtonClassName: "bg-transparent text-gray-400 border-none hover:text-white ml-2",
        closeButtonClassName: "text-[#ff8800] hover:text-white ml-2",
        iconClassName: "text-[#ff8800] w-6 h-6 mr-2",
      }}
      style={{
        zIndex: 9999,
        ...{
          '--normal-bg': '#232323',
          '--normal-text': '#fff',
          '--normal-border': '#ff8800',
        } as React.CSSProperties,
      }}
      {...props}
    />
  )
}

export { Toaster }

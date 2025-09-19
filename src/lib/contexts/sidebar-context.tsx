'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  toggle: () => void
  collapse: () => void
  expand: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

interface SidebarProviderProps {
  children: ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const toggle = () => setIsCollapsed(prev => !prev)
  const collapse = () => setIsCollapsed(true)
  const expand = () => setIsCollapsed(false)

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle, collapse, expand }}>
      {children}
    </SidebarContext.Provider>
  )
}
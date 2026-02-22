"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"
import { Menu, Filter, User, Heart, Clock, Settings } from "lucide-react"

interface MobileLayoutProps {
  children: React.ReactNode
  title: string
  filters?: React.ReactNode
  profile?: React.ReactNode
}

export default function MobileOptimizedLayout({ children, title, filters, profile }: MobileLayoutProps) {
  const isMobile = useIsMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className={`sticky top-0 z-10 bg-background transition-all ${scrolled ? "shadow-md" : ""}`}>
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Netflix Picker</SheetTitle>
                  <SheetDescription>Find your next favorite show</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-73px)]">
                  <div className="p-4 space-y-4">
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                        <Clock className="mr-2 h-4 w-4" />
                        Home
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                        <Heart className="mr-2 h-4 w-4" />
                        Watchlist
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                    <div className="pt-4 border-t">
                      <h3 className="mb-2 text-sm font-medium">Categories</h3>
                      {["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", "Documentary"].map((category) => (
                        <Button
                          key={category}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-bold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {filters && (
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Filter className="h-5 w-5" />
                    <span className="sr-only">Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[90%] sm:w-[450px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Refine your content recommendations</SheetDescription>
                  </SheetHeader>
                  <div className="py-4">{filters}</div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsFiltersOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsFiltersOpen(false)}>Apply Filters</Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            {profile && (
              <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Profile</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[90%] sm:w-[450px]">
                  <SheetHeader>
                    <SheetTitle>Profile</SheetTitle>
                    <SheetDescription>Manage your account and preferences</SheetDescription>
                  </SheetHeader>
                  <div className="py-4">{profile}</div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Content */}
      <main className="flex-1 container px-4 py-4">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="sticky bottom-0 border-t bg-background">
        <div className="grid grid-cols-4 h-16">
          <Button variant="ghost" className="flex flex-col h-full rounded-none">
            <Clock className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Button>
          <Button variant="ghost" className="flex flex-col h-full rounded-none">
            <Heart className="h-5 w-5" />
            <span className="text-xs mt-1">Watchlist</span>
          </Button>
          <Button variant="ghost" className="flex flex-col h-full rounded-none">
            <Filter className="h-5 w-5" />
            <span className="text-xs mt-1">Discover</span>
          </Button>
          <Button variant="ghost" className="flex flex-col h-full rounded-none">
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  )
}

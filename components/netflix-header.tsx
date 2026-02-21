"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Menu, X } from "lucide-react"
import CountrySelector from "./country-selector"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 bg-netflix-black/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <span className="text-white font-bold text-2xl">
            Movie<span className="text-netflix-red">Mood</span>
          </span>
          <span className="bg-netflix-red text-white px-2 py-0.5 ml-2 text-xs rounded-full">by Kapisch</span>
        </Link>

        {/* Service + Country Selector */}
        <div className="hidden md:flex flex-1 justify-center">
          <CountrySelector />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/discover" className="text-gray-300 hover:text-white transition-colors">
            Discover
          </Link>
          <Link href="/recommendations" className="text-gray-300 hover:text-white transition-colors">
            My Recommendations
          </Link>
          <Link href="/search">
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-netflix-black border-b border-gray-800 p-4 md:hidden">
            <div className="mb-4">
              <CountrySelector />
            </div>
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/discover" className="text-gray-300 hover:text-white transition-colors">
                Discover
              </Link>
              <Link href="/recommendations" className="text-gray-300 hover:text-white transition-colors">
                My Recommendations
              </Link>
              <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
                Search
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

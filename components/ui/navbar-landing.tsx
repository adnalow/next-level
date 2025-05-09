'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export const NavBarLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="glass-effect sticky top-0 z-50 border-b-2 border-[#ff8800]/20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="h-8 w-8 bg-gradient-to-br from-[#ff8800] to-[#ffa733] mr-3 rounded-md 
                          group-hover:animate-pulse transition-all duration-300"></div>
            <span className="font-bold text-white text-2xl md:text-3xl group-hover:text-[#ff8800] transition-colors duration-300">
              NEXT LEVEL
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-white hover:text-[#ff8800] transition-all duration-200 
                       text-xl relative after:content-[''] after:absolute after:bottom-0 after:left-0 
                       after:w-0 after:h-0.5 after:bg-[#ff8800] hover:after:w-full 
                       after:transition-all after:duration-300"
            >
              HOME
            </Link>
            <Link
              href="#process"
              className="text-white hover:text-[#ff8800] transition-all duration-200 
                       text-xl relative after:content-[''] after:absolute after:bottom-0 after:left-0 
                       after:w-0 after:h-0.5 after:bg-[#ff8800] hover:after:w-full 
                       after:transition-all after:duration-300"
            >
              PROCESS
            </Link>
            <Link
              href="#join"
              className="text-white hover:text-[#ff8800] transition-all duration-200 
                       text-xl relative after:content-[''] after:absolute after:bottom-0 after:left-0 
                       after:w-0 after:h-0.5 after:bg-[#ff8800] hover:after:w-full 
                       after:transition-all after:duration-300"
            >
              JOIN
            </Link>
            <Link href="/auth/login" 
                  className="group bg-gradient-to-r from-[#ff8800] to-[#ffa733] text-black font-bold px-6 py-2 rounded-md
                           hover:from-[#ffa733] hover:to-[#ff8800] transition-all duration-200 text-xl"
            >
              START
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white hover:text-[#ff8800] transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass-effect border-t border-[#ff8800]/20 py-4 px-4">
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-white hover:text-[#ff8800] py-2 text-xl
                       transition-colors duration-200 w-full hover:bg-black/20 px-4 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              HOME
            </Link>
            <Link
              href="#process"
              className="text-white hover:text-[#ff8800] py-2 text-xl
                       transition-colors duration-200 w-full hover:bg-black/20 px-4 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              PROCESS
            </Link>
            <Link
              href="#join"
              className="text-white hover:text-[#ff8800] py-2 text-xl
                       transition-colors duration-200 w-full hover:bg-black/20 px-4 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              JOIN
            </Link>
            <Link
              href="/auth/login"
              className="group bg-gradient-to-r from-[#ff8800] to-[#ffa733] text-black font-bold px-6 py-2 rounded-md
                       hover:from-[#ffa733] hover:to-[#ff8800] transition-all duration-200 text-xl text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              START
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
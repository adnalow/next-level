import React from 'react';
import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

const PixelFooter: React.FC = () => {
  return (
    <footer className="bg-[#181818] border-t border-[#ff8800]/30 pt-14 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-10">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-2xl md:text-3xl text-[#ff8800] tracking-widest mb-4 font-sans uppercase drop-shadow-lg">
              NEXT LEVEL
            </h3>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed font-sans mb-4">
              Connecting students with short-term job opportunities through our
              micro-apprenticeship platform.
            </p>
          </div>
          {/* Connect Section (was Quick Links) */}
          <div>
            <h3 className="font-bold text-xl md:text-2xl text-[#ff8800] tracking-widest mb-4 font-sans uppercase drop-shadow-lg">
              CONNECT
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/aicafiles"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group font-semibold text-gray-300 hover:text-[#ff8800] transition-colors duration-200 text-base flex items-center gap-2 font-sans"
                >
                  <span className="w-2 h-2 bg-[#ff8800] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Angelica Carandang
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/BorisHer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group font-semibold text-gray-300 hover:text-[#ff8800] transition-colors duration-200 text-base flex items-center gap-2 font-sans"
                >
                  <span className="w-2 h-2 bg-[#ff8800] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Boris Hernandez
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/adnalow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group font-semibold text-gray-300 hover:text-[#ff8800] transition-colors duration-200 text-base flex items-center gap-2 font-sans"
                >
                  <span className="w-2 h-2 bg-[#ff8800] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Reinier Adrian Luna
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/jstnnz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group font-semibold text-gray-300 hover:text-[#ff8800] transition-colors duration-200 text-base flex items-center gap-2 font-sans"
                >
                  <span className="w-2 h-2 bg-[#ff8800] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Justin Mae Nuñez
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/iZilchi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group font-semibold text-gray-300 hover:text-[#ff8800] transition-colors duration-200 text-base flex items-center gap-2 font-sans"
                >
                  <span className="w-2 h-2 bg-[#ff8800] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Kent Melard Pagcaliuangan
                </a>
              </li>
            </ul>
          </div>
          {/* Social Media Section (was Connect) */}
          <div>
            <h3 className="font-bold text-xl md:text-2xl text-[#ff8800] tracking-widest mb-4 font-sans uppercase drop-shadow-lg">
              SOCIAL MEDIA
            </h3>
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                className="group w-11 h-11 border-2 border-[#ff8800] rounded-lg flex items-center justify-center hover:bg-[#ff8800]/10 transition-colors duration-200"
              >
                <Facebook className="w-6 h-6 text-gray-300 group-hover:text-[#ff8800] transition-colors duration-200" />
              </a>
              <a
                href="#"
                className="group w-11 h-11 border-2 border-[#ff8800] rounded-lg flex items-center justify-center hover:bg-[#ff8800]/10 transition-colors duration-200"
              >
                <Twitter className="w-6 h-6 text-gray-300 group-hover:text-[#ff8800] transition-colors duration-200" />
              </a>
              <a
                href="#"
                className="group w-11 h-11 border-2 border-[#ff8800] rounded-lg flex items-center justify-center hover:bg-[#ff8800]/10 transition-colors duration-200"
              >
                <Linkedin className="w-6 h-6 text-gray-300 group-hover:text-[#ff8800] transition-colors duration-200" />
              </a>
            </div>
            <a
              href="mailto:info@nextlevel.com"
              className="group inline-flex items-center gap-2 font-semibold text-gray-300 hover:text-[#ff8800] transition-colors duration-200 text-base font-sans"
            >
              <Mail className="w-5 h-5" />
              info@nextlevel.com
            </a>
          </div>
        </div>
        {/* Copyright */}
        <div className="bg-[#232323] border-t border-[#ff8800]/10 rounded-lg p-4 mt-8">
          <p className="font-sans text-gray-500 text-base text-center tracking-wide">
            © 2025 NEXT LEVEL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PixelFooter;

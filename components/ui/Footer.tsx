import React from 'react';
import { Mail } from 'lucide-react';
import Link from 'next/link';

const PixelFooter: React.FC = () => {
  return (
    <footer className="bg-[#181818] border-t border-[#ff8800]/30 pt-14 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-center items-start gap-16 mb-10 w-full">
          {/* About Section */}
          <div className="flex flex-col items-start justify-center max-w-md">
            <h3 className="font-bold text-2xl md:text-3xl text-[#ff8800] tracking-widest mb-4 font-sans uppercase drop-shadow-lg">
              NEXT LEVEL
            </h3>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed font-sans mb-4">
              Connecting students with short-term job opportunities through our
              micro-apprenticeship platform.
            </p>
          </div>
          {/* Connect Section */}
          <div className="flex flex-col items-center justify-center w-full">
            <h3 className="font-bold text-xl md:text-2xl text-[#ff8800] tracking-widest mb-4 font-sans uppercase drop-shadow-lg">
              CONNECT
            </h3>
            <ul className="grid grid-cols-3 grid-rows-2 gap-x-12 gap-y-6 items-center justify-items-center w-full">
              <li className="flex items-center gap-3 justify-center">
                <a
                  href="https://github.com/aicafiles"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff8800] transition-colors duration-200 font-semibold text-gray-300 text-base font-sans flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  Angelica Carandang
                </a>
              </li>
              <li className="flex items-center gap-3 justify-center">
                <a
                  href="https://github.com/BorisHer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff8800] transition-colors duration-200 font-semibold text-gray-300 text-base font-sans flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  Boris Hernandez
                </a>
              </li>
              <li className="flex items-center gap-3 justify-center">
                <a
                  href="https://github.com/adnalow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff8800] transition-colors duration-200 font-semibold text-gray-300 text-base font-sans flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  Reinier Adrian Luna
                </a>
              </li>
              <li className="flex items-center gap-3 justify-center col-span-3">
                <div className="flex justify-center w-full gap-12">
                  <a
                    href="https://github.com/jstnnz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#ff8800] transition-colors duration-200 font-semibold text-gray-300 text-base font-sans flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    Justin Mae Nuñez
                  </a>
                  <a
                    href="https://github.com/iZilchi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#ff8800] transition-colors duration-200 font-semibold text-gray-300 text-base font-sans flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    Kent Melard Pagcaliuangan
                  </a>
                </div>
              </li>
            </ul>
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

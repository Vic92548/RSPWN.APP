import React from 'react';
import { ArrowLeft, Menu, X } from 'lucide-react';

interface HeaderProps {
    scrolled: boolean;
    onMenuToggle: () => void;
    menuOpen: boolean;
    backUrl?: string;
    backLabel?: string;
    rightContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
                                                  scrolled,
                                                  onMenuToggle,
                                                  menuOpen,
                                                  backUrl = '/',
                                                  backLabel = 'Back to RSPWN',
                                                  rightContent
                                              }) => {
    return (
        <header className={`fixed top-0 left-0 right-0 z-50 bg-[#2F2D2E] transition-all duration-300 ${scrolled ? 'shadow-2xl border-b border-white/10' : ''}`}>
            <div className="container mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <a
                        href={backUrl}
                        className="flex items-center gap-3 text-white hover:text-[#0f62fe] transition-colors duration-200 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                        <span className="font-medium">{backLabel}</span>
                    </a>
                    <div className="flex items-center gap-4">
                        {rightContent}
                        <button
                            onClick={onMenuToggle}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                        >
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
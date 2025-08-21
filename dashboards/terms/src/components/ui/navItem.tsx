import React from 'react';

interface NavItemProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'desktop' | 'mobile';
}

export const NavItem: React.FC<NavItemProps> = ({
                                                    active,
                                                    onClick,
                                                    children,
                                                    variant = 'desktop'
                                                }) => {
    const baseStyles = 'w-full text-left rounded-lg transition-all duration-200';

    const variantStyles = {
        desktop: 'px-4 py-2',
        mobile: 'px-4 py-3'
    };

    const activeStyles = active
        ? 'bg-[#0f62fe] text-white'
        : 'text-white/70 hover:bg-white/10 hover:text-white';

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variantStyles[variant]} ${activeStyles}`}
        >
            <span className="text-sm">{children}</span>
        </button>
    );
};

export default NavItem;
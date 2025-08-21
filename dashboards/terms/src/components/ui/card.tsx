import React from 'react';

interface CardProps {
    children: React.ReactNode,
    className?: string,
    hoverable?: boolean,
    onClick?: () => void,
    padding?: 'none' | 'sm' | 'md' | 'lg',
    id?: string
}

export const Card: React.FC<CardProps> = ({
                                              children,
                                              className = '',
                                              hoverable = true,
                                              onClick,
                                              padding = 'md',
                                              id
                                          }) => {
    const hoverStyles = hoverable ? 'hover:border-[#0f62fe]/50' : '';
    const clickableStyles = onClick ? 'cursor-pointer' : '';

    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6 sm:p-8',
        lg: 'p-8 sm:p-10'
    };

    return (
        <div
            id={id}
            className={`bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-all duration-200 ${hoverStyles} ${clickableStyles} ${paddingStyles[padding]} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
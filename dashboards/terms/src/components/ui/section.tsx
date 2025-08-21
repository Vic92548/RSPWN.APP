import React from 'react';

interface SectionProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'bordered' | 'hero';
    spacing?: 'sm' | 'md' | 'lg';
}

export const Section: React.FC<SectionProps> = ({
                                                    children,
                                                    className = '',
                                                    variant = 'default',
                                                    spacing = 'md'
                                                }) => {
    const variants = {
        default: 'bg-[#2F2D2E]',
        bordered: 'bg-[#2F2D2E] border-t border-white/10',
        hero: 'bg-[#2F2D2E] border-b border-white/10'
    };

    const spacingStyles = {
        sm: 'py-8 sm:py-12',
        md: 'py-12 sm:py-16',
        lg: 'py-16 sm:py-24'
    };

    return (
        <section className={`${variants[variant]} ${spacingStyles[spacing]} ${className}`}>
            {children}
        </section>
    );
};

export default Section;
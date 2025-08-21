import React from 'react';

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Container: React.FC<ContainerProps> = ({
                                                        children,
                                                        className = '',
                                                        maxWidth = 'full'
                                                    }) => {
    const maxWidthStyles = {
        sm: 'max-w-2xl',
        md: 'max-w-4xl',
        lg: 'max-w-6xl',
        xl: 'max-w-7xl',
        '2xl': 'max-w-8xl',
        full: ''
    };

    return (
        <div className={`container mx-auto px-4 sm:px-6 ${maxWidthStyles[maxWidth]} ${className}`}>
            {children}
        </div>
    );
};

export default Container;
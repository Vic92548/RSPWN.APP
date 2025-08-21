import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success';
}

export const IconButton: React.FC<IconButtonProps> = ({
                                                          icon: Icon,
                                                          size = 'md',
                                                          variant = 'default',
                                                          className = '',
                                                          ...props
                                                      }) => {
    const sizeStyles = {
        sm: 'p-1',
        md: 'p-2',
        lg: 'p-3'
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const variantStyles = {
        default: 'text-white/40 hover:bg-white/10',
        success: 'text-[#0f62fe]'
    };

    return (
        <button
            className={`rounded-lg transition-colors duration-200 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            <Icon className={iconSizes[size]} />
        </button>
    );
};

export default IconButton;
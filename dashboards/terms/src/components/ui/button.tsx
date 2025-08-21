import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    children: React.ReactNode;
    asLink?: boolean;
    href?: string;
}

export const Button: React.FC<ButtonProps> = ({
                                                  variant = 'primary',
                                                  size = 'md',
                                                  icon: Icon,
                                                  iconPosition = 'left',
                                                  children,
                                                  className = '',
                                                  asLink = false,
                                                  href,
                                                  ...props
                                              }) => {
    const baseStyles = 'rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-3 cursor-pointer';

    const variants = {
        primary: 'bg-[#0f62fe] text-white hover:bg-[#0f62fe]/90 transform hover:scale-105',
        secondary: 'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:border-white/40',
        ghost: 'hover:bg-white/10 text-white'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 sm:px-8 py-3',
        lg: 'px-8 sm:px-10 py-4 text-lg'
    };

    const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    if (asLink && href) {
        return (
            <a href={href} className={buttonClasses}>
                {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
                {children}
                {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
            </a>
        );
    }

    return (
        <button
            className={buttonClasses}
            {...props}
        >
            {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
        </button>
    );
};

export default Button;
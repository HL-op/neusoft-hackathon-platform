import React, { ButtonHTMLAttributes } from 'react';

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 触摸优化的按钮组件
 * 确保在移动端有良好的触摸体验
 */
export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  // 变体样式
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm min-w-[44px] min-h-[44px]',
    md: 'px-4 py-2 text-base min-w-[48px] min-h-[48px]',
    lg: 'px-6 py-3 text-lg min-w-[52px] min-h-[52px]'
  };

  return (
    <button
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded-md
        font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        active:scale-95
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

/**
 * 加载状态组件
 * 用于显示加载中的状态
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', message }) => {
  // 尺寸样式
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-t-transparent border-blue-500 ${sizeStyles[size]}`} />
      {message && <p className="mt-2 text-gray-600">{message}</p>}
    </div>
  );
};

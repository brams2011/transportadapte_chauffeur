import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
  animationDelay?: 0 | 100 | 200 | 300 | 400;
}

export default function Card({
  children,
  variant = 'default',
  hover = false,
  padding = 'md',
  className = '',
  animate = false,
  animationDelay = 0
}: CardProps) {
  const baseStyles = 'bg-white rounded-lg';

  const variants = {
    default: 'shadow',
    elevated: 'shadow-lg',
    outlined: 'border border-gray-200'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8'
  };

  const hoverClass = hover ? 'card-hover' : '';
  const animateClass = animate ? 'animate-fade-in' : '';
  const delayClass = animationDelay > 0 ? `animate-delay-${animationDelay}` : '';

  return (
    <div className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverClass} ${animateClass} ${delayClass} ${className}`}>
      {children}
    </div>
  );
}

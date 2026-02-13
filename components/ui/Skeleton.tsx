interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200';

  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style = {
    width: width || undefined,
    height: height || undefined
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
    />
  );
}

// Skeleton for Summary Cards
export function SummaryCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="w-20 h-4 mb-2" />
          <Skeleton className="w-32 h-8 mb-2" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton variant="circular" className="w-12 h-12" />
      </div>
    </div>
  );
}

// Skeleton for Charts
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <Skeleton className="w-40 h-6 mb-4" />
      <div className="h-64 md:h-80 flex items-end justify-around gap-4">
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-40" />
        <Skeleton className="w-full h-56" />
      </div>
    </div>
  );
}

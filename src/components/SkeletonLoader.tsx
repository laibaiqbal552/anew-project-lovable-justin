import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  variant?: 'text' | 'circle' | 'card' | 'review';
  height?: string;
  width?: string;
}

const SkeletonLoader = ({
  className = '',
  count = 1,
  variant = 'text',
  height = 'h-4',
  width = 'w-full'
}: SkeletonLoaderProps) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer';

  const variantClasses = {
    text: `${height} ${width} rounded`,
    circle: 'h-10 w-10 rounded-full',
    card: 'p-4 space-y-3',
    review: 'p-4 space-y-2'
  };

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className={`${height} ${width} rounded mb-3`}></div>
        <div className={`${height} ${width} rounded mb-3`}></div>
        <div className={`${height} w-3/4 rounded`}></div>
      </div>
    );
  }

  if (variant === 'review') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array(count)
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              className={`p-4 space-y-2 border border-gray-200 rounded-lg`}
            >
              <div className={`${baseClasses} h-4 w-1/3 rounded`}></div>
              <div className={`${baseClasses} h-3 w-full rounded`}></div>
              <div className={`${baseClasses} h-3 w-5/6 rounded`}></div>
              <div className="flex gap-1 pt-2">
                {Array(5)
                  .fill(null)
                  .map((_, j) => (
                    <div
                      key={j}
                      className={`${baseClasses} h-3 w-3 rounded`}
                    ></div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array(count)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]}`}
          ></div>
        ))}
    </div>
  );
};

export const ReviewSkeleton = ({ count = 2 }: { count?: number }) => (
  <div className="space-y-3">
    {Array(count)
      .fill(null)
      .map((_, i) => (
        <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
              <div className="h-2 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
            <div className="h-3 w-5/6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
          </div>
          <div className="flex gap-1 pt-2">
            {Array(5)
              .fill(null)
              .map((_, j) => (
                <div
                  key={j}
                  className="h-4 w-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"
                ></div>
              ))}
          </div>
        </div>
      ))}
  </div>
);

export const TrustpilotCardSkeleton = () => (
  <div className="space-y-4">
    {/* Rating Section */}
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
        <div className="h-3 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
      </div>
    </div>

    {/* Reviews List */}
    <div className="mt-4 space-y-3">
      <div className="h-3 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
      {Array(2)
        .fill(null)
        .map((_, i) => (
          <div key={i} className="p-3 space-y-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex gap-1">
              {Array(5)
                .fill(null)
                .map((_, j) => (
                  <div
                    key={j}
                    className="h-3 w-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"
                  ></div>
                ))}
            </div>
            <div className="h-3 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
            <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer"></div>
          </div>
        ))}
    </div>
  </div>
);

export default SkeletonLoader;

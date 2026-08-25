import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-momentum-border/60 rounded-md ${className}`}
      {...props}
    />
  );
};

export const SkeletonListItem = () => {
  return (
    <div className="flex items-center space-x-4 p-4 border border-momentum-border/50 bg-momentum-panel/30 rounded-lg mb-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
        <Skeleton className="h-2.5 w-5/6" />
      </div>
    </div>
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`p-5 border border-momentum-border/50 bg-momentum-panel/30 rounded-xl space-y-4 ${className}`}>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <div className="flex space-x-3">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const SkeletonList = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
};

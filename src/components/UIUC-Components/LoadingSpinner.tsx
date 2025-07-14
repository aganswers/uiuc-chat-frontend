import React from 'react'

export const LoadingSpinner = ({ size = 'md' }: { size?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const sizeClass =
    sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md

  return (
    <div
      className={`${sizeClass} animate-spin rounded-full border-2 border-gray-200 border-t-orange-500`}
    />
  )
}

import React from 'react';
import svgPaths from '../imports/svg-0m1jkx8owp';

interface ArrowButtonProps {
  direction: 'left' | 'right';
  disabled?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
}

export function ArrowButton({ direction, disabled = false, onClick, 'aria-label': ariaLabel }: ArrowButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // Determine fill color based on state
  let arrowFillColor = '#6E6E6E'; // Enabled
  
  if (disabled) {
    arrowFillColor = '#E8E8E8'; // Disabled
  }

  const showBackground = (isHovered || isPressed) && !disabled;
  const arrowPath = direction === 'left' ? svgPaths.p1fb6d4c0 : svgPaths.p30296c80;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className="relative shrink-0 size-[24px] cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      aria-label={ariaLabel}
      style={{
        backgroundColor: showBackground ? '#F5F5F5' : 'transparent',
        borderRadius: '12px',
      }}
    >
      <svg className="block size-[24px]" fill="none" viewBox="0 0 16 16">
        <g id={direction === 'left' ? 'Arrow / Left' : 'Arrow / Right'}>
          <path 
            d={arrowPath} 
            fill={arrowFillColor}
          />
        </g>
      </svg>
    </button>
  );
}
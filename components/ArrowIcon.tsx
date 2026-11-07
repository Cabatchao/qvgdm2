type ArrowIconProps = {
  direction?: 'up-right' | 'down';
  className?: string;
};

export default function ArrowIcon({ direction = 'up-right', className = '' }: ArrowIconProps) {
  return (
    <svg
      className={`arrow-icon ${className}`.trim()}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={direction === 'down' ? 'M8 2v12M3 9l5 5 5-5' : 'M3 13 13 3M3 3h10v10'} />
    </svg>
  );
}


import React from 'react';

export const SourceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-1.5-1.5a2 2 0 112.828-2.828l1.5 1.5a.5.5 0 00.707 0l.707-.707a2 2 0 010-2.828z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M7.414 15.414a2 2 0 01-2.828-2.828l3-3a2 2 0 012.828 0l1.5 1.5a2 2 0 01-2.828 2.828l-1.5-1.5a.5.5 0 00-.707 0l-.707.707a2 2 0 010 2.828z"
      clipRule="evenodd"
    />
  </svg>
);

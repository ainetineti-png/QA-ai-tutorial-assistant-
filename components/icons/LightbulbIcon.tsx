import React from 'react';

export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 14.25h3m-6.75 3h9.75m-1.5-12a3 3 0 11-6 0 3 3 0 016 0zM4.5 20.25h15A2.25 2.25 0 0021.75 18v-2.625c0-1.025-.5-1.995-1.355-2.671l-3.268-2.043a2.25 2.25 0 00-2.272 0l-3.27 2.043c-.855.676-1.355 1.646-1.355 2.67V18A2.25 2.25 0 004.5 20.25z" />
  </svg>
);
import React from 'react';
import bgpcImage from '../assets/bgpc.png';

interface BackgroundImageProps {
  children: React.ReactNode;
  className?: string;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`min-h-screen ${className}`}
      style={{
        backgroundImage: `url(${bgpcImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {children}
    </div>
  );
};

export default BackgroundImage;

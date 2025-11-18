import React from 'react';
import easymadeLogo from '../assets/easymade1.png';

const EasyMadeLogo: React.FC = () => (
  <div className="flex items-center">
    <img src={easymadeLogo} alt="EasyMade Logo" style={{ height: 56 }} />
    <div className="flex flex-col justify-center" style={{ marginLeft: '0.2mm' }}>
      <span style={{ fontWeight: 700, fontSize: 28, lineHeight: 1, letterSpacing: '-0.5px' }}>Easy Made</span>
      <span style={{ fontSize: 15, color: '#666', lineHeight: 1, marginTop: 2 }}>Cleaning Service</span>
    </div>
  </div>
);

export default EasyMadeLogo;
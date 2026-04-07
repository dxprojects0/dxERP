import React from 'react';

const DhandaXLoader: React.FC<{ subtitle?: string }> = ({ subtitle }) => {
  return (
    <div className="dhandax-loader-overlay">
      <div className="dhandax-loader-card">
        <div className="dhandax-loader-brand">DhandaX</div>
        {subtitle ? <div className="dhandax-loader-subtitle">{subtitle}</div> : null}
      </div>
    </div>
  );
};

export default DhandaXLoader;

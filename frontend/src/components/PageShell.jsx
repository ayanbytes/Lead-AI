import React from 'react';

const PageShell = ({ title, subtitle, children }) => {
  return (
    <div className="container mx-auto px-6 py-14">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-900">{title}</h2>
          {subtitle ? <p className="text-gray-600 mt-2 text-lg">{subtitle}</p> : null}
        </div>
        <div className="glass-card rounded-2xl p-8">{children}</div>
      </div>
    </div>
  );
};

export default PageShell;


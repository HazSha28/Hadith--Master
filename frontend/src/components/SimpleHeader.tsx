import React from 'react';
import { Link } from 'react-router-dom';

const SimpleHeader: React.FC = () => {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <span className="text-xl font-semibold tracking-wide">HADITH MASTER</span>
        </Link>

        {/* Center Section - Community Chat */}
        <div className="flex items-center justify-center">
          <button className="text-primary-foreground hover:bg-primary-foreground/20 flex items-center gap-2 px-3 py-2 rounded">
            Community Chat
          </button>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-3">
          {/* Navigation */}
          <div className="flex gap-2 bg-primary-foreground/10 p-1 rounded-lg">
            <Link to="/beginner">
              <button className="text-primary-foreground hover:bg-primary-foreground/20 px-3 py-1 rounded">
                Beginner
              </button>
            </Link>
            <Link to="/advanced">
              <button className="text-primary-foreground hover:bg-primary-foreground/20 px-3 py-1 rounded">
                Advanced
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;

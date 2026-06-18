import React from 'react';
import { Child } from '@my-app/shared';

interface ChildSelectorProps {
  childrenList: Child[];
  activeChild: Child | null;
  setActiveChild: (child: Child) => void;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({
  childrenList,
  activeChild,
  setActiveChild,
}) => {
  if (childrenList.length <= 1) return null;

  return (
    <div className="child-selector-container">
      {childrenList.map((child) => {
        const isActive = activeChild?.id === child.id;
        return (
          <button
            key={child.id}
            onClick={() => setActiveChild(child)}
            className={`child-selector-btn ${isActive ? 'active' : ''}`}
          >
            {child.name}
          </button>
        );
      })}
    </div>
  );
};

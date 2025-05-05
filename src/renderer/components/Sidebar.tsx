import React from 'react';
import homeIcon from '../../../assets/google-icons/home.svg';
import searchIcon from '../../../assets/google-icons/search.svg';
import settingsIcon from '../../../assets/google-icons/settings.svg';
import starIcon from '../../../assets/google-icons/star.svg';

interface SidebarProps {
  onMenuSelect: (menu: string) => void;
  expanded: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuSelect, expanded }) => {
  const menuItems = [
    { id: 'home', icon: homeIcon, label: 'ホーム' },
    { id: 'search', icon: searchIcon, label: '検索' },
    { id: 'favorites', icon: starIcon, label: 'お気に入り' },
    { id: 'settings', icon: settingsIcon, label: '設定' },
  ];

  return (
    <div className={`sidebar ${!expanded ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="sidebar-item"
            onClick={() => onMenuSelect(item.id)}
            title={item.label}
          >
            <img src={item.icon} alt={item.label} className="sidebar-icon" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;

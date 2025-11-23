import React from 'react';
import './CrewInfo.css';

function CrewInfo() {
  // Static crew data - in production, this would come from an API
  const crew = [
    {
      name: 'Jasmin Moghbeli',
      country: '🇺🇸 USA',
      role: 'Commander',
      mission: 'Expedition 70'
    },
    {
      name: 'Andreas Mogensen',
      country: '🇩🇰 Denmark',
      role: 'Flight Engineer',
      mission: 'Expedition 70'
    },
    {
      name: 'Satoshi Furukawa',
      country: '🇯🇵 Japan',
      role: 'Flight Engineer',
      mission: 'Expedition 70'
    },
    {
      name: 'Konstantin Borisov',
      country: '🇷🇺 Russia',
      role: 'Flight Engineer',
      mission: 'Expedition 70'
    },
    {
      name: 'Oleg Kononenko',
      country: '🇷🇺 Russia',
      role: 'Flight Engineer',
      mission: 'Expedition 70'
    },
    {
      name: 'Nikolai Chub',
      country: '🇷🇺 Russia',
      role: 'Flight Engineer',
      mission: 'Expedition 70'
    },
    {
      name: "Loral O'Hara",
      country: '🇺🇸 USA',
      role: 'Flight Engineer',
      mission: 'Expedition 70'
    }
  ];

  return (
    <div className="crew-info">
      <h2>👨‍🚀 Current Crew</h2>
      <div className="crew-list">
        {crew.map((member, index) => (
          <div key={index} className="crew-member">
            <div className="crew-avatar">
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="crew-details">
              <div className="crew-name">{member.name}</div>
              <div className="crew-country">{member.country}</div>
              <div className="crew-role">{member.role}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="crew-stats">
        <div className="stat">
          <div className="stat-value">{crew.length}</div>
          <div className="stat-label">Astronauts</div>
        </div>
        <div className="stat">
          <div className="stat-value">3</div>
          <div className="stat-label">Countries</div>
        </div>
        <div className="stat">
          <div className="stat-value">24/7</div>
          <div className="stat-label">Occupied</div>
        </div>
      </div>
    </div>
  );
}

export default CrewInfo;

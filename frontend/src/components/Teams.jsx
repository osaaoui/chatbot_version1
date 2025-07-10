// src/components/EquiposContent.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const EquiposContent = () => {
  const { t } = useTranslation();
  
  const teams = [
    {
      id: 1,
      name: 'Frontend Development',
      leader: 'Ana García',
      members: 5,
      status: 'active'
    },
    {
      id: 2,
      name: 'Backend Development',
      leader: 'Carlos Rodríguez',
      members: 4,
      status: 'active'
    },
    {
      id: 3,
      name: 'DevOps & Infrastructure',
      leader: 'María López',
      members: 3,
      status: 'active'
    },
    {
      id: 4,
      name: 'QA Testing',
      leader: 'David Martínez',
      members: 2,
      status: 'inactive'
    }
  ];

  const activeTeamsCount = teams.filter(t => t.status === 'active').length;
  const totalMembersCount = teams.reduce((acc, t) => acc + t.members, 0);

  return (
    <div className="w-full">
      <h2 className="text-heading text-2xl font-bold mb-6">{t('teams.title')}</h2>

      {/* Simple statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-secondary p-4 rounded-lg text-center">
          <h3 className="text-2xl font-bold text-heading">{teams.length}</h3>
          <p className="text-body text-sm">{t('teams.totalTeams')}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg text-center">
          <h3 className="text-2xl font-bold success">{activeTeamsCount}</h3>
          <p className="text-body text-sm">{t('teams.activeTeams')}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg text-center">
          <h3 className="text-2xl font-bold text-heading">{totalMembersCount}</h3>
          <p className="text-body text-sm">{t('teams.totalMembers')}</p>
        </div>
      </div>

      {/* Teams list */}
      <div className="space-y-3">
        {teams.map(team => (
          <div key={team.id} className="bg-secondary p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-heading text-lg font-semibold">{team.name}</h3>
                <p className="text-body text-sm">{t('teams.leader')} {team.leader}</p>
              </div>
              <div className="text-right">
                <p className="text-heading font-medium">
                  {team.members} {team.members === 1 ? t('teams.member') : t('teams.members')}
                </p>
                <span className={`text-sm font-medium ${team.status === 'active' ? 'success' : 'text-tertiary'}`}>
                  {team.status === 'active' ? t('common.active') : t('common.inactive')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquiposContent;
/**
 * @fileoverview Executive summary statistics cards for the SuperAdmin user management portal.
 *
 * Renders 4 high-level KPI tiles displaying counts of total registered users,
 * clinical medical staff, triage registration officers, and privileged administrators.
 *
 * @module app/superadmin/components/UserStatsCards
 */

import React from 'react';
import { UserStats } from '../types/superadmin';
import { SUPERADMIN_TEXTS } from '../constants/superadminTexts';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

interface UserStatsCardsProps {
  /** Aggregated user counts. */
  stats: UserStats;
}

/**
 * Renders KPI cards for user management overview.
 *
 * @param props - Component properties containing user stats.
 * @returns JSX element containing the 4-card metric grid.
 */
export const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats }) => {
  const S = SUPERADMIN_STYLES.statsCard;
  const T = SUPERADMIN_TEXTS.stats;

  const cardItems = [
    {
      title: T.totalUsersTitle,
      value: stats.totalUsers,
      desc: T.totalUsersDesc,
      icon: 'bx-group',
      iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
    },
    {
      title: T.clinicalTitle,
      value: stats.clinicalStaff,
      desc: T.clinicalDesc,
      icon: 'bx-plus-medical',
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    },
    {
      title: T.registrationTitle,
      value: stats.registrationStaff,
      desc: T.registrationDesc,
      icon: 'bx-id-card',
      iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    },
    {
      title: T.adminsTitle,
      value: stats.adminUsers,
      desc: T.adminsDesc,
      icon: 'bx-shield-quarter',
      iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    },
  ];

  return (
    <div className={S.grid}>
      {cardItems.map((item) => (
        <div key={item.title} className={S.card}>
          <div className={S.header}>
            <span className={S.title}>{item.title}</span>
            <div className={`${S.iconWrapper} ${item.iconBg}`}>
              <i className={`bx ${item.icon}`} aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className={S.value}>{item.value}</div>
            <div className={S.description}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

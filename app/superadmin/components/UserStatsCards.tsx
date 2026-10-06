/**
 * @fileoverview Executive summary statistics cards for the SuperAdmin user management portal.
 *
 * Renders 4 high-level KPI tiles displaying counts of total registered users,
 * clinical medical staff, triage registration officers, and privileged administrators.
 *
 * @remarks
 * Adheres strictly to AGENTS.md enterprise design standards: matching horizontal layout,
 * standardized metric tones (rose, emerald, slate, purple), round icon badges,
 * and high-contrast solid surfaces identical to the Admin Dashboard metrics.
 *
 * @module app/superadmin/components/UserStatsCards
 */

import React from 'react';
import { UserStats } from '../types/superadmin';
import { SUPERADMIN_TEXTS } from '../constants/superadminTexts';
import {
  SUPERADMIN_STYLES,
  SUPERADMIN_TONES,
  SuperadminToneKey,
} from '../constants/superadminStyles';

interface UserStatsCardsProps {
  /** Aggregated user counts. */
  stats: UserStats;
}

interface UserStatCardItem {
  key: string;
  title: string;
  value: number;
  desc: string;
  icon: string;
  tone: SuperadminToneKey;
}

/**
 * Renders executive KPI cards for user management overview.
 *
 * @param props - Component properties containing user stats.
 * @returns JSX element containing the 4-card metric grid.
 */
export const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats }) => {
  const S = SUPERADMIN_STYLES.metricCard;
  const T = SUPERADMIN_TEXTS.stats;

  const cardItems: UserStatCardItem[] = [
    {
      key: 'totalUsers',
      title: T.totalUsersTitle,
      value: stats.totalUsers,
      desc: T.totalUsersDesc,
      icon: 'bx-group',
      tone: 'rose',
    },
    {
      key: 'clinicalStaff',
      title: T.clinicalTitle,
      value: stats.clinicalStaff,
      desc: T.clinicalDesc,
      icon: 'bx-plus-medical',
      tone: 'emerald',
    },
    {
      key: 'registrationStaff',
      title: T.registrationTitle,
      value: stats.registrationStaff,
      desc: T.registrationDesc,
      icon: 'bx-id-card',
      tone: 'slate',
    },
    {
      key: 'adminUsers',
      title: T.adminsTitle,
      value: stats.adminUsers,
      desc: T.adminsDesc,
      icon: 'bx-shield-quarter',
      tone: 'purple',
    },
  ];

  return (
    <div className={SUPERADMIN_STYLES.metricGrid}>
      {cardItems.map((item) => {
        const toneStyle = SUPERADMIN_TONES[item.tone];
        return (
          <div key={item.key} className={`${S.tile} ${toneStyle.tile}`}>
            <span className={`${S.iconWrap} ${toneStyle.icon}`}>
              <i className={`bx ${item.icon}`} aria-hidden="true" />
            </span>
            <div className={S.content}>
              <p className={S.label}>{item.title}</p>
              <p className={S.value}>{item.value}</p>
              <p className={S.subtitle}>{item.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserStatsCards;

/**
 * @fileoverview Modal dialog component for creating and editing user accounts in SuperAdmin.
 *
 * Integrates credential inputs, role selection, dynamic cubicle/counter desk assignments,
 * real-time validation alerts, and asynchronous submission states.
 *
 * @module app/superadmin/components/UserModal
 */

import React from 'react';
import { SuperadminRole } from '../types/superadmin';
import {
  UseUserModalStateReturn,
  CLINICAL_ROLES,
  REGISTRATION_ROLES,
} from '../hooks/useUserModalState';
import { ClinicalAssignmentsSelector } from './ClinicalAssignmentsSelector';
import { RegistrationAssignmentsSelector } from './RegistrationAssignmentsSelector';
import { SUPERADMIN_TEXTS } from '../constants/superadminTexts';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

interface UserModalProps {
  /** Form state and controller methods from useUserModalState hook. */
  modalState: UseUserModalStateReturn;
  /** Success callback to trigger table refetch. */
  onSuccess: () => void;
}

/**
 * User account creation and editing modal dialog.
 *
 * @param props - Component properties.
 * @returns JSX element containing the modal dialog or null if closed.
 */
export const UserModal: React.FC<UserModalProps> = ({ modalState, onSuccess }) => {
  const S = SUPERADMIN_STYLES.modal;
  const B = SUPERADMIN_STYLES.buttons;
  const T = SUPERADMIN_TEXTS.modal;

  if (!modalState.isOpen) return null;

  const isClinical = CLINICAL_ROLES.includes(modalState.formRole);
  const isRegistration = REGISTRATION_ROLES.includes(modalState.formRole);

  return (
    <div className={S.backdrop} role="dialog" aria-modal="true">
      <div className={S.panel}>
        {/* Header */}
        <div className={S.header}>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-[#f5f5f5] flex items-center gap-2">
              <i
                className={`bx ${
                  modalState.isEditing ? 'bx-user-pin' : 'bx-user-plus'
                } text-[#a8071a] dark:text-[#f87171] text-xl`}
                aria-hidden="true"
              />
              {modalState.isEditing ? T.editTitle : T.addTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
              {modalState.isEditing ? T.editSubtitle : T.addSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={modalState.closeModal}
            className={B.ghost}
            aria-label="Close modal"
          >
            <i className="bx bx-x text-2xl" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => modalState.handleSubmit(e, onSuccess)}>
          <div className={S.body}>
            {/* Feedback Banners */}
            {modalState.formError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <i className="bx bx-error-circle text-lg shrink-0" aria-hidden="true" />
                <span>{modalState.formError}</span>
              </div>
            )}

            {modalState.formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <i className="bx bx-check-circle text-lg shrink-0" aria-hidden="true" />
                <span>{modalState.formSuccess}</span>
              </div>
            )}

            <div className={S.formGrid}>
              {/* Email */}
              <div className={S.formGroup}>
                <label className={S.label}>{T.emailLabel}</label>
                <input
                  type="email"
                  value={modalState.formEmail}
                  onChange={(e) => modalState.setFormEmail(e.target.value)}
                  placeholder={T.emailPlaceholder}
                  className={S.input}
                  required
                />
              </div>

              {/* Username */}
              <div className={S.formGroup}>
                <label className={S.label}>{T.usernameLabel}</label>
                <input
                  type="text"
                  value={modalState.formUsername}
                  onChange={(e) => modalState.setFormUsername(e.target.value)}
                  placeholder={T.usernamePlaceholder}
                  className={S.input}
                  required
                />
              </div>

              {/* Password */}
              <div className={S.formGroup}>
                <label className={S.label}>{T.passwordLabel}</label>
                <input
                  type="password"
                  value={modalState.formPassword}
                  onChange={(e) => modalState.setFormPassword(e.target.value)}
                  placeholder={
                    modalState.isEditing ? T.passwordEditHint : T.passwordPlaceholder
                  }
                  className={S.input}
                  required={!modalState.isEditing}
                />
                {modalState.isEditing && (
                  <p className="text-[11px] text-slate-400 mt-1">{T.passwordEditHint}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className={S.formGroup}>
                <label className={S.label}>{T.roleLabel}</label>
                <select
                  value={modalState.formRole}
                  onChange={(e) => modalState.setFormRole(e.target.value as SuperadminRole)}
                  className={S.select}
                >
                  <option value="registration" className={S.selectOption}>
                    {T.roleRegistration}
                  </option>
                  <option value="nurse" className={S.selectOption}>
                    {T.roleNurse}
                  </option>
                  <option value="doctor" className={S.selectOption}>
                    {T.roleDoctor}
                  </option>
                  <option value="admin" className={S.selectOption}>
                    {T.roleAdmin}
                  </option>
                  <option value="superadmin" className={S.selectOption}>
                    {T.roleSuperadmin}
                  </option>
                </select>
              </div>
            </div>

            {/* Role-Specific Assignment Grids */}
            {isClinical && (
              <ClinicalAssignmentsSelector
                cubicles={modalState.cubicles}
                selectedCubicleIds={modalState.selectedCubicleIds}
                onToggleCubicle={modalState.toggleCubicle}
              />
            )}

            {isRegistration && (
              <RegistrationAssignmentsSelector
                accessOptions={modalState.accessOptions}
                selectedServices={modalState.selectedServices}
                selectedRooms={modalState.selectedRooms}
                selectedCounters={modalState.selectedCounters}
                onToggleService={modalState.toggleService}
                onToggleRoom={modalState.toggleRoom}
                onToggleCounter={modalState.toggleCounter}
              />
            )}
          </div>

          {/* Footer Controls */}
          <div className={S.footer}>
            <button
              type="button"
              onClick={modalState.closeModal}
              className={B.secondary}
              disabled={modalState.formLoading}
            >
              {T.cancelButton}
            </button>
            <button
              type="submit"
              disabled={modalState.formLoading}
              className={B.primary}
            >
              {modalState.formLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{T.savingButton}</span>
                </>
              ) : (
                <span>{modalState.isEditing ? T.saveButton : T.createButton}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * @fileoverview Drag-and-drop file ingestion dropzone component for the Admin Dashboard.
 *
 * Implements accessible pointer drag detection, visual target illumination via
 * `.phc-dropzone`, native file browser trigger, and format restriction pills.
 *
 * @module app/dashboard/pages/import/components/FileDropzone
 */

'use client';

import React, { useRef } from 'react';
import { ACCEPT_FILE_INPUT } from '@/app/dashboard/pages/import/constants/import';
import { IMPORT_STYLES } from '@/app/dashboard/pages/import/constants/importStyles';
import { IMPORT_TEXTS } from '@/app/dashboard/pages/import/constants/importTexts';

/**
 * Properties for the {@link FileDropzone} component.
 */
export interface FileDropzoneProps {
  /** Flag indicating whether the pointer is currently hovering dragged files over the dropzone. */
  isDragging: boolean;
  /** Callback invoked when files are selected via browse or dropped. */
  onFilesSelected: (files: FileList | File[]) => void;
  /** Pointer drag enter handler. */
  onDragEnter: (e: React.DragEvent) => void;
  /** Pointer drag leave handler. */
  onDragLeave: (e: React.DragEvent) => void;
  /** Pointer drop handler. */
  onDrop: (e: React.DragEvent) => void;
}

/**
 * Drag-and-drop file upload target component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function FileDropzone({
  isDragging,
  onFilesSelected,
  onDragEnter,
  onDragLeave,
  onDrop,
}: FileDropzoneProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const S = IMPORT_STYLES.dropzone;
  const T = IMPORT_TEXTS.dropzone;

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so re-uploading the same file still fires onChange
      e.target.value = '';
    }
  };

  return (
    <div className={S.wrapper}>
      <div
        className={isDragging ? S.area.active : S.area.idle}
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
        aria-label={T.idleTitle}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_FILE_INPUT}
          className="hidden"
          onChange={handleInputChange}
          tabIndex={-1}
        />

        <div className={S.iconWrapper}>
          <i className={`bx ${isDragging ? 'bx-download' : 'bx-cloud-upload'} ${S.icon}`} />
        </div>

        <h3 className={S.title}>{isDragging ? T.activeTitle : T.idleTitle}</h3>
        <p className={S.subtitle}>{isDragging ? T.activeSubtitle : T.idleSubtitle}</p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
          className={S.browseButton}
        >
          <i className="bx bx-folder-open text-base" />
          <span>{T.browseButton}</span>
        </button>

        <div className={S.formatPills}>
          <span className={S.pill}>.XLS (Excel 97-2004)</span>
          <span className={S.pill}>.XLSX (Modern Excel)</span>
          <span className={S.pill}>.CSV (Patient Dataset)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * @fileoverview Accessible countdown warning modal dialog ("Are You Still There?").
 *
 * Prompts inactive kiosk patients with an urgent countdown timer before their check-in
 * session expires. Styled with Heart Check PHC brand red colors (#a8071a / #c9142b),
 * an enlarged dialog card for enhanced visibility, circular SVG progress indicator,
 * and prominent tactile buttons for elderly and hesitant patients.
 *
 * Architectural & Operational Rules:
 * - High-Quality Documentation: Full symbol and module level JSDocs (Rule 1).
 * - Separation of Concerns: Copy from `inactivityModalTexts.ts`, styles from `inactivityModalStyles.ts` (Rule 2).
 * - Kiosk UI Centering: Dialog perfectly centered horizontally and vertically (Rule 9).
 * - High-Contrast Solid Surfaces: Solid clinical background without blurry glassmorphism (Rule 10).
 * - Zero Emojis Standard: Replaced with Boxicons and clean text (Rule 6).
 * - Prohibition of Text Ellipsis: Copy wraps naturally without ellipsis (Rule 11).
 *
 * @module app/kiosk/components/InactivityTimeoutModal
 */

"use client";

import { useEffect, useRef } from "react";
import { InactivityModalTexts } from "@/app/kiosk/constants/inactivityModalTexts";
import {
  InactivityModalClasses,
  InactivityModalStyles,
  InactivityTimerColors,
} from "@/app/kiosk/constants/inactivityModalStyles";

/**
 * Props for {@link InactivityTimeoutModal}.
 */
export interface InactivityTimeoutModalProps {
  /**
   * Whether the modal is currently displayed.
   */
  isOpen: boolean;

  /**
   * Current remaining seconds until session reset (e.g. 15 down to 0).
   */
  remainingSeconds: number;

  /**
   * Total grace period duration in seconds (used to compute SVG progress offset).
   * @defaultValue 15
   */
  totalSeconds?: number;

  /**
   * Callback invoked when the patient taps "Continue Session".
   */
  onContinue: () => void;

  /**
   * Callback invoked when the patient taps "Start Over".
   */
  onReset: () => void;
}

/**
 * Props for {@link CountdownProgressRing}.
 */
interface CountdownProgressRingProps {
  /**
   * Total duration in seconds over which the ring continuously and smoothly depletes.
   */
  totalSeconds: number;
}

/**
 * Continuous 60fps circular progress countdown ring for {@link InactivityTimeoutModal}.
 *
 * Runs an uninterrupted requestAnimationFrame loop to continuously and smoothly deplete
 * the SVG progress ring, decoupled from discrete 1-second state ticks to achieve fluid motion.
 *
 * @param props - Component properties.
 * @returns The SVG circular countdown ring element.
 */
function CountdownProgressRing({ totalSeconds }: CountdownProgressRingProps) {
  const circleRef = useRef<SVGCircleElement | null>(null);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const durationMs = totalSeconds * 1000;
    const startTime = performance.now();
    let animationFrameId: number;

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.max(0, Math.min(1, 1 - elapsed / durationMs));
      const dashLength = circumference * progress;

      if (circleRef.current) {
        circleRef.current.setAttribute(
          "stroke-dasharray",
          `${dashLength} ${circumference}`
        );
        circleRef.current.setAttribute(
          "stroke-linecap",
          progress > 0.005 ? "round" : "butt"
        );
        // Switch to vibrant red when reaching the critical threshold (5s remaining)
        if (progress <= 5 / totalSeconds) {
          circleRef.current.setAttribute("stroke", InactivityTimerColors.brightRed);
        } else {
          circleRef.current.setAttribute("stroke", InactivityTimerColors.brandRed);
        }
      }

      if (elapsed < durationMs) {
        animationFrameId = requestAnimationFrame(step);
      }
    }

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [totalSeconds, circumference]);

  return (
    <svg className="w-32 h-32" viewBox="0 0 120 120" aria-hidden="true">
      {/* Grayish Empty Circular Track */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke={InactivityTimerColors.emptyTrack}
        strokeWidth="8"
        fill="none"
      />
      {/* Fluid 60fps Continuous Depletion Progress Ring - Clockwise from 12 o'clock */}
      <circle
        ref={circleRef}
        cx="60"
        cy="60"
        r={radius}
        stroke={InactivityTimerColors.brandRed}
        strokeWidth="8"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        fill="none"
      />
    </svg>
  );
}

/**
 * High-contrast modal dialog presenting the "Are You Still There?" countdown prompt.
 *
 * @param props - Component properties.
 * @returns The countdown modal dialog element, or null if closed.
 */
export default function InactivityTimeoutModal({
  isOpen,
  remainingSeconds,
  totalSeconds = 15,
  onContinue,
  onReset,
}: InactivityTimeoutModalProps) {
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);

  // Auto-focus primary "Continue" button when modal opens for immediate touch/keyboard access
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        continueButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle keyboard navigation: Escape key continues session
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onContinue();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  const isCriticalTime = remainingSeconds <= 5;
  const secondsSuffix =
    remainingSeconds === 1
      ? InactivityModalTexts.secondsSuffixSingular
      : InactivityModalTexts.secondsSuffix;

  return (
    <div
      role={InactivityModalTexts.ariaRole}
      aria-modal="true"
      aria-label={InactivityModalTexts.ariaLabel}
      aria-labelledby="inactivity-dialog-title"
      aria-describedby="inactivity-dialog-desc"
      className={InactivityModalClasses.backdrop}
      style={InactivityModalStyles.backdrop}
    >
      <div
        className={InactivityModalClasses.card}
        style={InactivityModalStyles.card}
      >
        {/* Urgent Alert Boxicon Badge with PHC brand red tone */}
        <div className={InactivityModalClasses.iconWrap} aria-hidden="true">
          <i className="bx bx-time-five" />
        </div>

        {/* Modal Headings (Bilingual English / Filipino) */}
        <h2
          id="inactivity-dialog-title"
          className={InactivityModalClasses.title}
        >
          {InactivityModalTexts.title}
        </h2>
        <span className={InactivityModalClasses.subtitle}>
          {InactivityModalTexts.subtitle}
        </span>

        {/* Explanatory Body Copy */}
        <p
          id="inactivity-dialog-desc"
          className={InactivityModalClasses.description}
        >
          {InactivityModalTexts.description}
        </p>
        <p className={InactivityModalClasses.descriptionEnglish}>
          {InactivityModalTexts.descriptionEnglish}
        </p>

        {/* Enlarged Circular Countdown Progress Ring with Bold Seconds Counter */}
        <div className={InactivityModalClasses.timerWrapper}>
          <div className={InactivityModalClasses.timerCircleWrapper}>
            <CountdownProgressRing totalSeconds={totalSeconds} />

            {/* Centered Solid Disc with Large Digits */}
            <div className={InactivityModalClasses.timerCenterDisc}>
              <span
                className={`${InactivityModalClasses.timerCountText} ${
                  isCriticalTime ? "text-[#c9142b]" : ""
                }`}
                aria-live={InactivityModalTexts.ariaCountdownLive}
                aria-label={`${InactivityModalTexts.countdownNotice} ${remainingSeconds} ${secondsSuffix}`}
              >
                {remainingSeconds}
              </span>
            </div>
          </div>

          {/* Countdown Helper Text with PHC Red Pill Badge */}
          <div className={InactivityModalClasses.countdownNotice}>
            <span>{InactivityModalTexts.countdownNotice}</span>
            <span className={InactivityModalClasses.countdownBadge}>
              {remainingSeconds} {secondsSuffix}
            </span>
          </div>
        </div>

        {/* Action Buttons: Continue Session (Primary) vs Start Over (Secondary) */}
        <div className={InactivityModalClasses.actionsGrid}>
          {/* Secondary Action: Start Over */}
          <button
            type="button"
            onClick={onReset}
            className={InactivityModalClasses.resetButton}
            style={InactivityModalStyles.resetButton}
          >
            <span>{InactivityModalTexts.resetButton}</span>
            <span className={InactivityModalClasses.resetSub}>
              {InactivityModalTexts.resetButtonSub}
            </span>
          </button>

          {/* Primary Action: Continue Session with PHC Brand Red */}
          <button
            ref={continueButtonRef}
            type="button"
            onClick={onContinue}
            className={InactivityModalClasses.continueButton}
            style={InactivityModalStyles.continueButton}
          >
            <span>{InactivityModalTexts.continueButton}</span>
            <span className={InactivityModalClasses.continueSub}>
              {InactivityModalTexts.continueButtonSub}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

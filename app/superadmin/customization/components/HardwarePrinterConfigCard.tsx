/**
 * @fileoverview SuperAdmin Hardware Thermal Receipt Printer Configuration & Diagnostics Card.
 *
 * Provides diagnostic telemetry, WebUSB direct device pairing, and Network IP Socket
 * (port 9100) test dispatch for administrators.
 *
 * Architectural Features:
 * - Direct WebUSB / WebSerial pairing modal trigger running within browser sandbox.
 * - Reactive hardware state updating immediately upon USB cable attachment/detachment.
 * - Network socket verification triggering authorized diagnostic print test.
 * - Strict Separation of Concerns: copy consumed from `customizationTexts.ts`.
 *
 * @module app/superadmin/customization/components/HardwarePrinterConfigCard
 */

'use client';

import { useState, useEffect } from 'react';
import { useWebPrinter } from '@/app/kiosk/hooks/useWebPrinter';
import { printTestTicketWebUsb } from '@/lib/printer/webPrinter';
import { adminApi } from '@/app/superadmin/lib/adminApi';
import { CUSTOMIZATION_TEXTS } from '@/app/superadmin/customization/constants/customizationTexts';
import { CUSTOMIZATION_STYLES } from '@/app/superadmin/customization/constants/customizationStyles';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';

const STORAGE_KEY = 'phc_network_printer_ip';

/**
 * Superadmin configuration card for thermal receipt printers.
 *
 * @returns JSX element containing the printer configuration and diagnostics card.
 */
export function HardwarePrinterConfigCard() {
  const T = CUSTOMIZATION_TEXTS.hardwarePrinter;
  const S = CUSTOMIZATION_STYLES;
  const B = SUPERADMIN_STYLES.buttons;

  const { status, hardwareStatus, pairUsb, pairSerial } = useWebPrinter();

  const [networkIp, setNetworkIp] = useState<string>('');
  const [testingUsb, setTestingUsb] = useState<boolean>(false);
  const [testingDevice, setTestingDevice] = useState<boolean>(false);
  const [testingNetwork, setTestingNetwork] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const linuxUdevCommand = `echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="070b", MODE="0666"' | sudo tee /etc/udev/rules.d/99-xprinter.rules && echo 'KERNEL=="lp[0-9]*", MODE="0666"' | sudo tee -a /etc/udev/rules.d/99-xprinter.rules && sudo udevadm control --reload-rules && sudo udevadm trigger`;

  const handleCopyCommand = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(linuxUdevCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIp = localStorage.getItem(STORAGE_KEY) || '';
      setNetworkIp(savedIp);
    }
  }, []);

  const handleSaveIp = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, networkIp.trim());
      setFeedback({ message: 'Network printer IP saved to local settings.', isError: false });
    }
  };

  const executeDeviceTest = async (isKernelFallback: boolean = false) => {
    setTestingDevice(true);
    setFeedback(null);
    try {
      const data = await adminApi('/api/superadmin/test-printer', 'POST', { method: 'device' });
      if (data?.success) {
        setFeedback({
          message: isKernelFallback
            ? T.usbClaimFallbackSuccess
            : data.message || T.testSuccessMessage,
          isError: false,
        });
      } else {
        setFeedback({ message: data?.error || T.testFailedMessage, isError: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ message: `Server device error: ${msg}`, isError: true });
    } finally {
      setTestingDevice(false);
    }
  };

  const handleTestUsb = async () => {
    setTestingUsb(true);
    setFeedback(null);
    try {
      const result = await printTestTicketWebUsb();
      if (result.claimedByKernel) {
        console.log(
          '[WEBUSB FALLBACK] USB Interface is claimed by Linux kernel (usblp driver). Seamlessly printing via server device node (/dev/usb/lp*)...'
        );
        await executeDeviceTest(true);
        return;
      }

      setFeedback({ message: result.message, isError: !result.success });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('WEBUSB_INTERFACE_CLAIMED_BY_KERNEL') ||
        msg.includes('claimInterface') ||
        msg.includes('Unable to claim interface')
      ) {
        console.log(
          '[WEBUSB FALLBACK] WebUSB interface claim blocked by kernel. Seamlessly falling back to local device node (/dev/usb/lp*)...'
        );
        await executeDeviceTest(true);
        return;
      }

      if (msg.includes('Access denied')) {
        setFeedback({
          message:
            'Linux USB Access Denied: Chrome was blocked by Linux kernel permissions. Run the one-time udev rule below or test via Server Node (/dev/usb/lp*).',
          isError: true,
        });
      } else {
        setFeedback({ message: `USB test error: ${msg}`, isError: true });
      }
    } finally {
      setTestingUsb(false);
    }
  };

  const handleTestDevice = async () => {
    await executeDeviceTest(false);
  };

  const handleTestNetwork = async () => {
    setTestingNetwork(true);
    setFeedback(null);
    try {
      const data = await adminApi('/api/superadmin/test-printer', 'POST', {
        method: 'network',
        printerIp: networkIp.trim(),
      });
      if (data?.success) {
        setFeedback({ message: data.message || T.testSuccessMessage, isError: false });
      } else {
        setFeedback({ message: data?.error || T.testFailedMessage, isError: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ message: `Network request error: ${msg}`, isError: true });
    } finally {
      setTestingNetwork(false);
    }
  };

  return (
    <div className={`${S.sectionBox} mb-6`}>
      <div className={S.sectionHeader}>
        <i className="bx bx-printer text-base text-rose-600 dark:text-rose-400" aria-hidden="true" />
        <span>{T.cardTitle}</span>
      </div>
      <p className={S.sectionSubtitle}>{T.cardSubtitle}</p>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900'
          }`}
        >
          <i
            className={`bx ${feedback.isError ? 'bx-error-circle' : 'bx-check-circle'} text-base shrink-0`}
            aria-hidden="true"
          />
          <span>{feedback.message}</span>
        </div>
      )}

      <div className={S.grid2}>
        {/* Tier 1: Direct USB Web Detection */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-[#f5f5f5]">
              {T.usbSectionTitle}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  status.connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#242424] dark:text-[#a3a3a3]'
                }`}
              >
                {status.connected ? T.usbConnectedBadge : T.usbNotConnectedBadge}
              </span>
              {hardwareStatus.condition !== 'ready' &&
                hardwareStatus.condition !== 'not_detected' && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 uppercase">
                    {hardwareStatus.condition.replace(/_/g, ' ')}
                  </span>
                )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3] leading-relaxed">
            {T.usbSectionDesc}
          </p>

          <div className="text-xs text-slate-700 dark:text-[#d4d4d4] font-mono bg-slate-50 dark:bg-[#141414] p-2.5 rounded-lg border border-slate-200 dark:border-[#2e2e2e]">
            <span className="block font-semibold">{status.name}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{status.details}</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={pairUsb}
              className={`${B.secondary} text-xs py-1.5 px-3`}
            >
              <i className="bx bx-usb text-sm" aria-hidden="true" />
              <span>{T.pairUsbButton}</span>
            </button>
            <button
              type="button"
              onClick={pairSerial}
              className={`${B.secondary} text-xs py-1.5 px-3`}
            >
              <i className="bx bx-chip text-sm" aria-hidden="true" />
              <span>{T.pairSerialButton}</span>
            </button>
            {status.connected && (
              <button
                type="button"
                onClick={handleTestUsb}
                disabled={testingUsb}
                className={`${B.primary} text-xs py-1.5 px-3`}
              >
                <i className="bx bx-receipt text-sm" aria-hidden="true" />
                <span>{testingUsb ? T.testingLabel : T.testUsbButton}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleTestDevice}
              disabled={testingDevice}
              className={`${B.secondary} text-xs py-1.5 px-3`}
            >
              <i className="bx bx-hdd text-sm" aria-hidden="true" />
              <span>{testingDevice ? T.testingLabel : T.testDeviceButton}</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Network / Ethernet IP Socket (Port 9100) */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-[#f5f5f5]">
              {T.networkSectionTitle}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
              LAN Port 9100
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3] leading-relaxed">
            {T.networkSectionDesc}
          </p>

          <div>
            <label className={S.label}>{T.networkIpLabel}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={networkIp}
                onChange={(e) => setNetworkIp(e.target.value)}
                placeholder={T.networkIpPlaceholder}
                className={S.input}
              />
              <button
                type="button"
                onClick={handleSaveIp}
                className={`${B.secondary} text-xs px-3 shrink-0`}
              >
                {T.saveIpButton}
              </button>
            </div>
            <p className={S.helpText}>{T.networkIpHelp}</p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestNetwork}
              disabled={testingNetwork || !networkIp.trim()}
              className={`${B.primary} text-xs py-1.5 px-3`}
            >
              <i className="bx bx-wifi text-sm" aria-hidden="true" />
              <span>{testingNetwork ? T.testingLabel : T.testNetworkButton}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Linux Permission Guide Helper */}
      <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#2e2e2e] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="bx bx-terminal text-base text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span className="text-xs font-bold text-slate-800 dark:text-[#e5e5e5]">
              {T.linuxTipTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCommand}
            className={`${B.secondary} text-[11px] py-1 px-2.5 flex items-center gap-1.5`}
          >
            <i className={`bx ${copied ? 'bx-check' : 'bx-copy'} text-xs`} aria-hidden="true" />
            <span>{copied ? 'Copied' : 'Copy 1-Time Command'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-[#a3a3a3] leading-relaxed">
          {T.linuxTipText}
        </p>
        <div className="p-2.5 rounded-lg bg-black/90 text-emerald-400 font-mono text-[10px] break-all border border-slate-800 select-all overflow-x-auto">
          {linuxUdevCommand}
        </div>
      </div>
    </div>
  );
}

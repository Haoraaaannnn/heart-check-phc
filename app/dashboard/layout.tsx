import DashboardBG from '@/components/backgrounds/DashboardBg';
import Sidebar from '@/app/dashboard/components/navigation/DashSideNavigation';
import DashboardHeader from '@/app/dashboard/components/navigation/DashboardHeader';
import { HistoricalSummaryProvider } from '@/app/dashboard/context/HistoricalSummaryContext';
import { DASH } from '@/app/dashboard/constants/styles';

/**
 * Admin dashboard shell.
 *
 * Structure (matches the approved layout):
 *   ┌───────────────────────── Header (sticky) ─────────────────────────┐
 *   ├─ Sidebar (sticky) ─┬──────────────── Page content ────────────────┤
 *
 * All class names come from DASH.layout in constants/styles.ts.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <HistoricalSummaryProvider>
      <DashboardBG>
        <div className={DASH.layout.shell}>
          <DashboardHeader />
          <div className={DASH.layout.body}>
            <Sidebar />
            <main className={DASH.layout.main}>{children}</main>
          </div>
        </div>
      </DashboardBG>
    </HistoricalSummaryProvider>
  );
}
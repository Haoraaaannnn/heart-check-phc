/**
 * @fileoverview Centralized presentation styles and responsive layout tokens for Public TV Monitor displays.
 *
 * Adheres strictly to AGENTS.md standards:
 * - Comprehensive JSDoc documentation (Rule 1)
 * - Strict separation of concerns (Rule 2)
 * - Pure CSS utility mappings with zero inline style objects
 * - Zero emojis in comments or code (Rule 6)
 * - Screen-size adaptive with zero scrolling on any viewport
 *
 * @module app/monitor/constants/monitorStyles
 */

export const MONITOR_STYLES = {
  viewport: {
    container: 'h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden flex flex-col bg-white text-slate-800 font-sans select-none',
    main: 'flex-1 min-h-0 w-full overflow-hidden flex flex-col justify-center',
  },
  header: {
    container: 'flex-shrink-0 bg-[#cc3535] px-6 py-3.5 sm:px-8 sm:py-4 lg:px-12 lg:py-5 flex items-center justify-between shadow-md z-20',
    brandWrap: 'flex items-center gap-5',
    subTitle: 'text-white/80 text-xs sm:text-sm lg:text-base uppercase tracking-widest font-semibold',
    title: 'text-white font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-none',
    clockWrap: 'text-right',
    clockTime: 'text-white font-bold tabular-nums text-2xl sm:text-4xl md:text-5xl lg:text-6xl leading-none',
    clockDate: 'text-white/80 text-xs sm:text-sm lg:text-base mt-1 font-medium',
  },
  footer: {
    container: 'w-full flex-shrink-0 bg-gray-100 border-t border-gray-200 px-6 py-2.5 sm:px-8 sm:py-3 lg:px-12 lg:py-3.5 flex items-center justify-between z-20',
    instruction: 'text-gray-500 font-medium text-xs sm:text-sm md:text-base lg:text-lg',
  },
  startScreen: {
    container: 'h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden bg-white flex flex-col items-center justify-center gap-4 sm:gap-6 p-6 select-none',
    backButton: 'fixed top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-[#cc3535] transition group cursor-pointer z-10',
    backIcon: 'bx bx-arrow-back text-xl group-hover:-translate-x-1 transition-transform',
    backLabel: 'text-sm font-medium',
    iconBadge: 'w-14 h-14 sm:w-16 sm:h-16 bg-[#cc3535] rounded-2xl flex items-center justify-center shadow-lg shadow-red-200',
    icon: 'bx bx-plus-medical text-3xl text-white',
    title: 'text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 text-center',
    startButton: 'px-8 py-3.5 sm:px-12 sm:py-4.5 bg-[#cc3535] text-white text-lg sm:text-2xl font-bold rounded-2xl sm:rounded-3xl hover:bg-[#b02c2c] active:scale-95 transition shadow-lg shadow-red-200 cursor-pointer',
  },
  pairedLayout: {
    container: 'flex-1 min-h-0 w-full p-3 sm:p-5 lg:p-8 flex flex-col justify-center overflow-hidden',
    emptyStateWrap: 'flex-1 flex items-center justify-center',
    emptyStateText: 'text-gray-300 text-3xl sm:text-4xl lg:text-5xl font-bold text-center',
    innerWrapper: 'w-full max-w-7xl mx-auto flex-1 min-h-0 flex flex-col justify-center',
    headerRow: 'grid grid-cols-2 gap-4 lg:gap-8 mb-2 sm:mb-4 flex-shrink-0',
    headerTitle: 'text-gray-600 text-lg sm:text-2xl lg:text-3xl font-bold text-center',
    pairsList: 'flex-1 min-h-0 flex flex-col justify-around gap-2 sm:gap-3 lg:gap-4',
    pairRow: 'grid grid-cols-2 gap-4 lg:gap-8 flex-1 min-h-0 items-stretch',
    nowServingCard: 'bg-[#cc3535] rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center gap-1 shadow-xl shadow-red-200 ring-4 ring-red-100 p-2 sm:p-4 lg:p-6 h-full transition-all',
    nowServingBadge: 'text-white/80 text-xs sm:text-sm lg:text-base font-black uppercase tracking-widest',
    nowServingTicketPrimary: 'font-black tabular-nums text-white text-5xl sm:text-7xl lg:text-8xl drop-shadow-md leading-none',
    nowServingTicketSecondary: 'font-black tabular-nums text-gray-500 text-2xl sm:text-3xl lg:text-4xl leading-none',
    standardServingCard: 'bg-white border-2 border-gray-100 rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center gap-1 p-2 sm:p-4 lg:p-6 h-full opacity-80',
    cubicleCard: 'bg-gray-50 rounded-2xl lg:rounded-3xl p-2 sm:p-4 lg:p-6 shadow-sm border-2 border-gray-100 flex flex-col items-center justify-center h-full',
    cubicleLabel: 'text-gray-700 font-bold text-xl sm:text-3xl lg:text-4xl text-center break-words',
    doctorLabel: 'text-gray-500 font-semibold text-sm sm:text-lg lg:text-xl mt-1 text-center break-words',
    emptyCardText: 'text-gray-300 text-2xl sm:text-3xl font-bold',
  },
  tableLayout: {
    container: 'flex-1 min-h-0 w-full p-3 sm:p-5 lg:p-6 flex flex-col justify-center overflow-hidden',
    emptyStateWrap: 'flex-1 flex items-center justify-center',
    emptyStateText: 'text-gray-300 text-3xl sm:text-4xl lg:text-5xl font-bold text-center',
    tableWrapper: 'w-full h-full flex flex-col justify-center overflow-hidden',
    table: 'w-full h-full table-fixed border-collapse',
    headerRow: 'bg-gray-100 border-b-2 border-gray-200',
    headerCellRoom: 'px-3 py-2 sm:px-4 sm:py-3 text-left text-gray-700 text-sm sm:text-base lg:text-lg font-bold uppercase tracking-wider w-36 sm:w-44 lg:w-52',
    headerCellCubicle: 'px-3 py-2 sm:px-4 sm:py-3 text-center text-gray-700 text-sm sm:text-base lg:text-lg font-bold uppercase tracking-wider border-l border-gray-200',
    doctorSubHeader: 'text-xs sm:text-sm font-medium normal-case text-gray-500 mt-0.5 break-words',
    dataRow: 'border-b border-gray-100',
    roomCell: 'px-3 py-2 sm:px-4 sm:py-3 font-bold text-gray-800 text-base sm:text-xl lg:text-2xl bg-gray-50 border-r border-gray-200 align-middle text-center w-36 sm:w-44 lg:w-52',
    cubicleCell: 'px-2 py-2 sm:px-3 sm:py-3 text-center border-l border-gray-100 align-middle h-full',
    cellContentWrap: 'flex flex-col items-center justify-center gap-1.5 h-full max-h-full',
    nowServingCard: 'relative w-full bg-[#cc3535] rounded-xl sm:rounded-2xl lg:rounded-3xl p-2 sm:p-3 lg:p-4 shadow-xl shadow-red-200 ring-3 sm:ring-4 ring-red-100 flex flex-col items-center justify-center gap-0.5 sm:gap-1 max-h-full',
    nowServingBadge: 'text-white/80 text-[10px] sm:text-xs lg:text-sm font-black uppercase tracking-widest leading-none',
    nowServingTicket: 'text-white font-black text-3xl sm:text-5xl lg:text-6xl tabular-nums leading-none drop-shadow-md',
    activePulseDot: 'absolute top-2 right-2 sm:top-3 sm:right-3 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse',
    waitingCard: 'w-full bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 shadow-xs border border-gray-100 flex items-center justify-center opacity-75',
    waitingTicket: 'text-gray-500 font-bold text-sm sm:text-xl lg:text-2xl tabular-nums',
    emptyCellText: 'text-gray-300 text-lg sm:text-xl font-bold',
  },
  registrationLayout: {
    container: 'flex-1 min-h-0 w-full p-3 sm:p-5 lg:p-8 flex flex-col justify-center overflow-hidden',
    gridWrapper: 'w-full h-full max-w-7xl mx-auto flex flex-col justify-center overflow-hidden',
    columnsContainer: 'grid gap-2 sm:gap-4 lg:gap-6 w-full h-full min-h-0 items-stretch',
    counterColumn: 'flex flex-col gap-2 h-full min-h-0 justify-between',
    counterHeader: 'bg-gray-100 border border-gray-200 rounded-xl sm:rounded-2xl py-2 sm:py-3 text-center text-gray-700 font-bold text-sm sm:text-lg lg:text-xl uppercase tracking-wider flex-shrink-0',
    cardBody: 'flex-1 min-h-0 flex flex-col items-stretch justify-center gap-2',
    nowServingCard: 'flex-1 min-h-0 flex flex-col items-center justify-center bg-[#cc3535] rounded-2xl lg:rounded-3xl shadow-xl shadow-red-200 ring-4 ring-red-100 p-2 sm:p-4 lg:p-6 relative text-white',
    nowServingBadge: 'text-white/80 text-xs sm:text-sm lg:text-base font-black uppercase tracking-widest leading-none',
    nowServingTicket: 'text-white font-black text-4xl sm:text-6xl lg:text-7xl tabular-nums leading-none drop-shadow-md my-1',
    activePulseDot: 'absolute top-3 right-3 sm:top-4 sm:right-4 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse',
    emptyCounterCard: 'flex-1 min-h-0 flex items-center justify-center bg-gray-50 border-2 border-gray-100 rounded-2xl lg:rounded-3xl text-gray-300 text-2xl sm:text-4xl font-bold',
    waitingRow: 'flex items-center justify-center gap-1.5 flex-shrink-0 flex-wrap max-h-16 overflow-hidden pt-1',
    waitingBadge: 'bg-gray-100 text-gray-600 rounded-md sm:rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold border border-gray-200 tabular-nums',
  },
  selector: {
    container: 'h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden bg-gray-50 flex flex-col items-start justify-start p-6 sm:p-10 text-slate-800 select-none',
    backButton: 'flex items-center gap-2 text-gray-500 hover:text-[#cc3535] transition group cursor-pointer mb-4 sm:mb-6 flex-shrink-0',
    backIcon: 'bx bx-arrow-back text-xl group-hover:-translate-x-1 transition-transform',
    backLabel: 'text-sm font-medium',
    title: 'text-2xl sm:text-3xl font-bold text-gray-700 flex-shrink-0 mb-4 sm:mb-6',
    grid: 'grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl overflow-y-auto p-1',
    subGrid: 'grid grid-cols-2 gap-4 w-full max-w-md overflow-y-auto p-1',
    categoryButton: 'bg-white border-2 border-gray-100 hover:border-[#cc3535] hover:text-[#cc3535] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-gray-700 font-semibold text-xs sm:text-sm shadow-xs transition text-left cursor-pointer active:scale-98',
  },
} as const;

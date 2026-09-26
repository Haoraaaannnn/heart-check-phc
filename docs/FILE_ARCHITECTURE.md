```text
Directory structure:
└── haoraaaannnn-heart-check-phc/
    ├── AGENTS.md
    ├── README.md
    ├── declaration.d.ts
    ├── eslint.config.mjs
    ├── next.config.ts
    ├── package.json
    ├── postcss.config.mjs
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── provider.tsx
    │   ├── actions/
    │   │   └── sendSMS.ts
    │   ├── api/
    │   │   ├── auth/
    │   │   │   ├── change-password/
    │   │   │   │   └── route.ts
    │   │   │   ├── forgot-password/
    │   │   │   │   └── route.ts
    │   │   │   ├── login/
    │   │   │   │   └── route.ts
    │   │   │   ├── reset-password/
    │   │   │   │   └── route.ts
    │   │   │   └── verify-recovery/
    │   │   │       └── route.ts
    │   │   ├── print-ticket/
    │   │   │   └── route.ts
    │   │   ├── rotate/
    │   │   │   └── route.ts
    │   │   └── superadmin/
    │   │       ├── access/
    │   │       │   └── route.ts
    │   │       ├── create-user/
    │   │       │   └── route.ts
    │   │       ├── cubicles/
    │   │       │   └── route.ts
    │   │       ├── delete-user/
    │   │       │   └── route.ts
    │   │       ├── sync-users/
    │   │       │   └── route.ts
    │   │       └── update-role/
    │   │           └── route.ts
    │   ├── auth/
    │   │   └── confirm/
    │   │       └── route.ts
    │   ├── dashboard/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── analytics/
    │   │   │   ├── page.tsx
    │   │   │   ├── components/
    │   │   │   │   ├── AlgorithmComparisonTable.tsx
    │   │   │   │   ├── ArimaForecast.tsx
    │   │   │   │   ├── BottleneckStageTable.tsx
    │   │   │   │   ├── DateRangeSelector.tsx
    │   │   │   │   ├── ExportExcelButton.tsx
    │   │   │   │   ├── LRForecast.tsx
    │   │   │   │   ├── MetricCardShow.tsx
    │   │   │   │   ├── PHCComplianceSummary.tsx
    │   │   │   │   └── VolumeAndWaitCharts.tsx
    │   │   │   └── hooks/
    │   │   │       └── useAnalyticsData.ts
    │   │   ├── components/
    │   │   │   ├── DashboardCard.tsx
    │   │   │   ├── DashboardMetrics.tsx
    │   │   │   ├── DonutChart.tsx
    │   │   │   ├── HistoricalContextBanner.tsx
    │   │   │   ├── HourlyArrivalChart.tsx
    │   │   │   ├── LiveQueueTable.tsx
    │   │   │   ├── NotificationDropdown.tsx
    │   │   │   ├── QuickLinks.tsx
    │   │   │   ├── RecentActivity.tsx
    │   │   │   ├── ServiceQueueOverview.tsx
    │   │   │   ├── ServiceStats.tsx
    │   │   │   ├── StatusBadge.tsx
    │   │   │   ├── TicketStatusBreakdown.tsx
    │   │   │   ├── WelcomeBanner.tsx
    │   │   │   └── navigation/
    │   │   │       ├── DashSideNavigation.tsx
    │   │   │       ├── DashboardHeader.tsx
    │   │   │       ├── HeaderSearch.tsx
    │   │   │       └── LiveClock.tsx
    │   │   ├── constants/
    │   │   │   ├── charts.ts
    │   │   │   ├── content.ts
    │   │   │   ├── navigation.ts
    │   │   │   └── styles.ts
    │   │   ├── context/
    │   │   │   └── HistoricalSummaryContext.tsx
    │   │   ├── cubicles/
    │   │   │   └── page.tsx
    │   │   ├── hooks/
    │   │   │   ├── useBottleneckNotifications.ts
    │   │   │   ├── useDashboardTheme.ts
    │   │   │   ├── useIdleTimeout.ts
    │   │   │   ├── useMountedClock.ts
    │   │   │   └── useOverviewData.ts
    │   │   ├── pages/
    │   │   │   ├── analytics/
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── components/
    │   │   │   │   │   ├── AlgorithmComparisonTable.tsx
    │   │   │   │   │   ├── AnalyticsHeader.tsx
    │   │   │   │   │   ├── AnalyticsMetricCards.tsx
    │   │   │   │   │   ├── ArimaForecast.tsx
    │   │   │   │   │   ├── BottleneckStageTable.tsx
    │   │   │   │   │   ├── DateRangeSelector.tsx
    │   │   │   │   │   ├── ExportExcelButton.tsx
    │   │   │   │   │   ├── LRForecast.tsx
    │   │   │   │   │   ├── PHCComplianceSummary.tsx
    │   │   │   │   │   └── VolumeAndWaitCharts.tsx
    │   │   │   │   ├── constants/
    │   │   │   │   │   ├── analytics.ts
    │   │   │   │   │   └── analyticsTexts.ts
    │   │   │   │   └── hooks/
    │   │   │   │       └── useAnalyticsData.ts
    │   │   │   ├── cubicles/
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── components/
    │   │   │   │   │   ├── CubicleCard.tsx
    │   │   │   │   │   ├── CubiclesGrid.tsx
    │   │   │   │   │   ├── CubiclesHeader.tsx
    │   │   │   │   │   ├── CubiclesLegend.tsx
    │   │   │   │   │   └── CubiclesStatsGrid.tsx
    │   │   │   │   ├── constants/
    │   │   │   │   │   ├── cubicles.ts
    │   │   │   │   │   └── cubiclesTexts.ts
    │   │   │   │   ├── hooks/
    │   │   │   │   │   └── useCubiclesData.ts
    │   │   │   │   └── types/
    │   │   │   │       └── cubicle.ts
    │   │   │   ├── overview/
    │   │   │   │   └── page.tsx
    │   │   │   └── patients/
    │   │   │       ├── page.tsx
    │   │   │       ├── components/
    │   │   │       │   ├── HourlyPatientFlowChart.tsx
    │   │   │       │   ├── PatientStatGrid.tsx
    │   │   │       │   ├── PatientsHeader.tsx
    │   │   │       │   ├── RecentPatientTable.tsx
    │   │   │       │   ├── ServiceDistributionChart.tsx
    │   │   │       │   ├── ServiceFilterBar.tsx
    │   │   │       │   └── ServiceQueuePanel.tsx
    │   │   │       ├── constants/
    │   │   │       │   ├── patients.ts
    │   │   │       │   └── patientsTexts.ts
    │   │   │       └── hooks/
    │   │   │           ├── usePatientsAnalyticsData.ts
    │   │   │           ├── usePatientsData.ts
    │   │   │           └── useServiceQueue.ts
    │   │   └── patients/
    │   │       ├── page.tsx
    │   │       ├── components/
    │   │       │   ├── HourlyPatientFlowChart.tsx
    │   │       │   ├── PatientStatGrid.tsx
    │   │       │   ├── RecentPatientTable.tsx
    │   │       │   ├── ServiceDistributionChart.tsx
    │   │       │   ├── ServiceFilterBar.tsx
    │   │       │   └── ServiceQueuePanel.tsx
    │   │       ├── constants/
    │   │       │   └── patients.ts
    │   │       └── hooks/
    │   │           ├── usePatientsAnalyticsData.ts
    │   │           ├── usePatientsData.ts
    │   │           └── useServiceQueue.ts
    │   ├── forgot-password/
    │   │   └── page.tsx
    │   ├── kiosk/
    │   │   ├── README.md
    │   │   ├── layout.tsx
    │   │   ├── components/
    │   │   │   └── KioskLoadingOverlay.tsx
    │   │   ├── constants/
    │   │   │   ├── kioskBackButton.ts
    │   │   │   ├── kioskBackButtonTexts.ts
    │   │   │   ├── kioskLayout.ts
    │   │   │   ├── kioskLayoutTexts.ts
    │   │   │   ├── kioskLoadingOverlay.ts
    │   │   │   ├── kioskLoadingOverlayTexts.ts
    │   │   │   └── kioskNavigation.ts
    │   │   ├── context/
    │   │   │   └── KioskLoadingContext.tsx
    │   │   ├── hooks/
    │   │   │   └── useKioskNavigate.ts
    │   │   └── pages/
    │   │       ├── category-selection/
    │   │       │   ├── page.tsx
    │   │       │   └── constants/
    │   │       │       ├── categoryCards.ts
    │   │       │       ├── categoryCardsTexts.ts
    │   │       │       ├── categoryHeader.ts
    │   │       │       ├── categoryHeaderTexts.ts
    │   │       │       ├── categoryLayout.ts
    │   │       │       ├── categorySelection.ts
    │   │       │       └── categorySelectionTexts.ts
    │   │       ├── confirmation/
    │   │       │   ├── layout.tsx
    │   │       │   ├── page.tsx
    │   │       │   ├── components/
    │   │       │   │   ├── ConfimationDescription.tsx
    │   │       │   │   ├── ConfirmationActions.tsx
    │   │       │   │   ├── ConfirmationBanner.tsx
    │   │       │   │   └── ConfirmationModal.tsx
    │   │       │   └── constants/
    │   │       │       ├── confirmation.ts
    │   │       │       ├── confirmationActions.ts
    │   │       │       ├── confirmationActionsTexts.ts
    │   │       │       ├── confirmationBanner.ts
    │   │       │       ├── confirmationDescription.ts
    │   │       │       ├── confirmationDescriptionTexts.ts
    │   │       │       ├── confirmationLayout.ts
    │   │       │       ├── confirmationLayoutTexts.ts
    │   │       │       ├── confirmationModal.ts
    │   │       │       ├── confirmationModalTexts.ts
    │   │       │       └── confirmationTexts.ts
    │   │       ├── kiosk-cubicle-selection/
    │   │       │   ├── layout.tsx
    │   │       │   ├── page.tsx
    │   │       │   ├── components/
    │   │       │   │   ├── CubicleCard.tsx
    │   │       │   │   └── CubicleHeader.tsx
    │   │       │   ├── constants/
    │   │       │   │   ├── cubicleCard.ts
    │   │       │   │   ├── cubicleHeader.ts
    │   │       │   │   ├── cubicleHeaderTexts.ts
    │   │       │   │   ├── cubicleLayout.ts
    │   │       │   │   ├── cubicleSelection.ts
    │   │       │   │   └── cubicleSelectionTexts.ts
    │   │       │   └── types/
    │   │       │       └── CubicleSelectorType.ts
    │   │       ├── kiosk-new-old-selection/
    │   │       │   ├── layout.tsx
    │   │       │   ├── page.tsx
    │   │       │   ├── components/
    │   │       │   │   ├── KioskTitle.tsx
    │   │       │   │   ├── PatientTypeBanner.tsx
    │   │       │   │   └── PatientTypeCards.tsx
    │   │       │   ├── constants/
    │   │       │   │   ├── kioskNewOld.ts
    │   │       │   │   ├── kioskNewOldLayout.ts
    │   │       │   │   ├── kioskNewOldTexts.ts
    │   │       │   │   ├── kioskTitle.ts
    │   │       │   │   ├── kioskTitleTexts.ts
    │   │       │   │   ├── patientTypeBanner.ts
    │   │       │   │   ├── patientTypeBannerTexts.ts
    │   │       │   │   └── patientTypeCards.ts
    │   │       │   └── types/
    │   │       │       └── PatientType.ts
    │   │       ├── kiosk-services/
    │   │       │   ├── layout.tsx
    │   │       │   ├── page.tsx
    │   │       │   ├── components/
    │   │       │   │   ├── KioskBanner.tsx
    │   │       │   │   ├── KioskFooterWave.tsx
    │   │       │   │   ├── KioskHeader.tsx
    │   │       │   │   ├── KioskServicesCard.tsx
    │   │       │   │   └── KioskServicesGrid.tsx
    │   │       │   └── constants/
    │   │       │       ├── kioskBanner.ts
    │   │       │       ├── kioskBannerTexts.ts
    │   │       │       ├── kioskHeader.ts
    │   │       │       ├── kioskHeaderTexts.ts
    │   │       │       └── kioskServices.ts
    │   │       ├── queue-print/
    │   │       │   ├── layout.tsx
    │   │       │   ├── page.tsx
    │   │       │   ├── components/
    │   │       │   │   ├── PrintFooter.tsx
    │   │       │   │   ├── PrintHeader.tsx
    │   │       │   │   └── QueuePrintContent.tsx
    │   │       │   └── constants/
    │   │       │       ├── printFooter.ts
    │   │       │       ├── printFooterTexts.ts
    │   │       │       ├── printHeader.ts
    │   │       │       ├── printHeaderTexts.ts
    │   │       │       ├── queuePrint.ts
    │   │       │       ├── queuePrintLayout.ts
    │   │       │       ├── queuePrintTexts.ts
    │   │       │       ├── queuePrintTicket.ts
    │   │       │       └── queuePrintTicketTexts.ts
    │   │       └── sms-input/
    │   │           ├── layout.tsx
    │   │           ├── page.tsx
    │   │           ├── components/
    │   │           │   ├── ContinueButton.tsx
    │   │           │   ├── KioskPhoneEntry.tsx
    │   │           │   ├── NumPad.tsx
    │   │           │   ├── PhoneInput.tsx
    │   │           │   ├── SMSBanner.tsx
    │   │           │   └── SMSInstruction.tsx
    │   │           └── constants/
    │   │               ├── smsBanner.ts
    │   │               ├── smsContinueButton.ts
    │   │               ├── smsContinueButtonTexts.ts
    │   │               ├── smsInput.ts
    │   │               ├── smsInputTexts.ts
    │   │               ├── smsInstruction.ts
    │   │               ├── smsInstructionTexts.ts
    │   │               ├── smsLayout.ts
    │   │               ├── smsModalTexts.ts
    │   │               ├── smsNumPad.ts
    │   │               └── smsPhoneInput.ts
    │   ├── login/
    │   │   └── page.tsx
    │   ├── monitor/
    │   │   ├── page.tsx
    │   │   ├── [category]/
    │   │   │   └── page.tsx
    │   │   ├── components/
    │   │   │   ├── ElapsedTimer.tsx
    │   │   │   ├── Footer.tsx
    │   │   │   ├── Header.tsx
    │   │   │   ├── PairedLayout.tsx
    │   │   │   ├── RegistrationLayout.tsx
    │   │   │   ├── StartScreen.tsx
    │   │   │   └── TableLayout.tsx
    │   │   ├── hooks/
    │   │   │   ├── useMonitorData.ts
    │   │   │   └── useRealtimeSubscription.ts
    │   │   └── lib/
    │   │       └── constants.ts
    │   ├── nurse/
    │   │   ├── page.tsx
    │   │   ├── components/
    │   │   │   ├── AssignedSection.tsx
    │   │   │   ├── CarryoutSection.tsx
    │   │   │   ├── ElapsedTimer.tsx
    │   │   │   ├── FinishedDrawer.tsx
    │   │   │   ├── FinishedTable.tsx
    │   │   │   ├── NurseBoard.tsx
    │   │   │   ├── NurseDragGhost.tsx
    │   │   │   ├── NurseDragHandle.tsx
    │   │   │   ├── NurseHeader.tsx
    │   │   │   ├── NursePatientCard.tsx
    │   │   │   ├── NurseSelectionBanner.tsx
    │   │   │   ├── NurseSidebar.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── StageColumn.tsx
    │   │   │   └── WithDoctorSection.tsx
    │   │   ├── constants/
    │   │   │   ├── nurse.ts
    │   │   │   └── nurseTexts.ts
    │   │   ├── hooks/
    │   │   │   ├── dragUtils.ts
    │   │   │   ├── useIdleTimeout.ts
    │   │   │   ├── useNurseActions.ts
    │   │   │   ├── useNurseData.ts
    │   │   │   ├── useNurseDragAndDrop.ts
    │   │   │   ├── useNurseSelection.ts
    │   │   │   ├── useRealtimeSubscription.ts
    │   │   │   └── useRequireAuth.ts
    │   │   ├── lib/
    │   │   │   └── constants.ts
    │   │   └── types/
    │   │       └── nurse.ts
    │   ├── reset-password/
    │   │   ├── page.tsx
    │   │   └── confirm/
    │   │       └── page.tsx
    │   ├── superadmin/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── components/
    │   │   │   ├── ChangePasswordForm.tsx
    │   │   │   ├── SettingsPannel.tsx
    │   │   │   └── SuperAdminNav.tsx
    │   │   ├── customization/
    │   │   │   └── page.tsx
    │   │   └── hooks/
    │   │       ├── useIdleTimeout.ts
    │   │       └── useRequireAuth.ts
    │   └── transfer/
    │       ├── page.tsx
    │       ├── components/
    │       │   ├── BreadcrumbNav.tsx
    │       │   ├── ConsultationFlow.tsx
    │       │   ├── CubicleCard.tsx
    │       │   ├── DoctorsModal.tsx
    │       │   ├── DoctorsPanel.tsx
    │       │   ├── DragGhost.tsx
    │       │   ├── DragHandle.tsx
    │       │   ├── ElapsedTimer.tsx
    │       │   ├── IdleNumbersPanel.tsx
    │       │   ├── IdleNumbersSection.tsx
    │       │   ├── OPScreeningFlow.tsx
    │       │   ├── OnProgressSection.tsx
    │       │   ├── OtherServicesFlow.tsx
    │       │   ├── QueueAndIdleLayout.tsx
    │       │   ├── QueuePanel.tsx
    │       │   ├── RegistrationCounterSection.tsx
    │       │   ├── ServiceBoard.tsx
    │       │   ├── Sidebar.tsx
    │       │   └── StepPickers.tsx
    │       ├── constants/
    │       │   ├── transfer.ts
    │       │   └── transferTexts.ts
    │       ├── hooks/
    │       │   ├── dragUtils.ts
    │       │   ├── useAutoAssign.ts
    │       │   ├── useAutoRotate.ts
    │       │   ├── useCubicleData.ts
    │       │   ├── useDragAndDrop.ts
    │       │   ├── useIdlePatients.ts
    │       │   ├── useIdleTimeout.ts
    │       │   ├── useMaxRotations.ts
    │       │   ├── useMyAccess.ts
    │       │   ├── usePatientData.ts
    │       │   ├── useRealtimeSubscription.ts
    │       │   ├── useRegistrationDragAndDrop.ts
    │       │   ├── useRegistrationRotate.ts
    │       │   ├── useRequireAuth.ts
    │       │   └── useRotateTimeout.ts
    │       └── lib/
    │           ├── constants.ts
    │           └── rotateApi.ts
    ├── components/
    │   ├── backgrounds/
    │   │   └── DashboardBg.tsx
    │   ├── modals/
    │   │   └── ConfirmationModal.tsx
    │   └── reusables/
    │       ├── BackButton.tsx
    │       ├── KioskBackButton.tsx
    │       ├── NotificationBadge.tsx
    │       ├── ScrollArea.tsx
    │       ├── analyticsMetricCards.tsx
    │       ├── analyticsMetricHeader.tsx
    │       ├── analyticsMetricPara.tsx
    │       ├── metricCards.tsx
    │       ├── patientHeaderCard.tsx
    │       ├── patientMetricCard.tsx
    │       └── serviceMetricCard.tsx
    ├── constants/
    │   ├── app.ts
    │   ├── colors.ts
    │   ├── kiosk.ts
    │   ├── palette.ts
    │   ├── queueStatus.ts
    │   └── themes.js
    ├── docs/
    │   ├── ARCHITECTURE.md
    │   ├── CHANGES_NEEDED.md
    │   ├── COMPONENTS_GUIDE.md
    │   ├── DATABASE_SCHEMA.md
    │   ├── FILE_ARCHITECTURE.md
    │   ├── OPEN_ISSUES.md
    │   ├── PRD.md
    │   ├── SCHEMA_REFERENCE.md
    │   ├── SECURITY.md
    │   ├── SETUP_AND_SEEDING.md
    │   ├── TRANSFER_DASHBOARD.md
    │   ├── TRANSFER_MANUAL_TWEAKING_GUIDE.md
    │   └── NURSE_DASHBOARD_SYSTEM_DESIGN.md
    ├── fonts/
    │   └── fonts.ts
    ├── hooks/
    │   ├── useIsLandscape.ts
    │   └── useIsMounted.ts
    ├── lib/
    │   ├── logger.ts
    │   ├── printer.ts
    │   ├── supabase.ts
    │   └── supabase/
    │       ├── admin.ts
    │       ├── authGuard.ts
    │       ├── client.ts
    │       ├── server.ts
    │       └── superadminGuard.ts
    ├── python_backend/
    │   ├── auto_seed.sh
    │   ├── check_dates.py
    │   ├── db_seeder.py
    │   ├── debug_analytics.py
    │   ├── dropped_rows_2024_DEC.csv
    │   ├── dropped_rows_2024_NOV.csv
    │   ├── import_phc_data.py
    │   ├── import_seeder_to_supabase.py
    │   ├── main.py
    │   ├── requirements.txt
    │   ├── run.py
    │   ├── analytics/
    │   │   ├── __init__.py
    │   │   ├── constants.py
    │   │   ├── descriptive.py
    │   │   ├── export.py
    │   │   ├── forecasting.py
    │   │   ├── helpers.py
    │   │   ├── preprocessing.py
    │   │   ├── queue_metrics.py
    │   │   ├── report.py
    │   │   └── staffing.py
    │   └── testers/
    │       ├── test_analytics.py
    │       ├── test_arima.py
    │       ├── test_arima_aic.py
    │       ├── test_forecasting_pipeline.py
    │       └── test_staffing.py
    ├── types/
    │   ├── Services.ts
    │   └── Types.ts
    └── utils/
        ├── chartDataPrep.ts
        ├── formatDateTime.ts
        ├── formatMinutesToHMS.ts
        └── waitTime.ts
```

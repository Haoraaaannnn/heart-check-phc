HEART_CHECK_PHC/
├── app/
│   ├── (auth)/                         # Login routes for staff/admin 
│   │   ├── login/
│   │   │   └── page.tsx                # Secure login interface 
│   │   └── layout.tsx                  # Centered login box layout
│   ├── (kiosk)/                        # Patient-Facing Kiosk System 
│   │   ├── kiosk-selection/            # Service selection (Consultation, ECG, etc.) 
│   │   │   ├── page.tsx                
│   │   │   └── layout.tsx
│   │   └── confirmation/               # Confirmation and input handling
│   │       ├── page.tsx                 
│   │       └── layout.tsx   
│   ├── (display)/                      # Queue Information Displays (Front-End) 
│   │   └── registration/               # Main waiting area queue status 
│   │       ├── page.tsx
│   │       ├── layout.tsx          
│   │       ├── adult/                  # Adult-specific room/doctor tracking 
│   │       │   ├── page.tsx
│   │       │   └── layout.tsx          
│   │       └── pedia/                  # Pedia-specific room/doctor tracking 
│   │           ├── page.tsx
│   │           └── layout.tsx        
│   ├── (dashboard)/                    # Staff & Administrative Control 
│   │   ├── nurse/
│   │   │   ├── page.tsx                # Patient transfer and status management 
│   │   │   └── history/
│   │   │       └── page.tsx            # Recent patient logs 
│   │   ├── admin/
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx            # Bottleneck reports & predictive data 
│   │   │   ├── doctors/
│   │   │   │   └── page.tsx            # Manage doctor profiles/assignments 
│   │   │   └── reports/
│   │   │       └── page.tsx            # Daily summary and data-driven insights 
│   │   └── layout.tsx                  # Sidebar navigation for authenticated staff 
│   ├── api/                            # Backend Logic & Database interactions 
│   │   ├── queue/                      # Logic for generation and timestamps 
│   │   ├── notify/                     # SMS alert trigger system 
│   │   └── route.ts
│   ├── layout.tsx                      # Root layout (Metadata, Google Fonts)
│   └── page.tsx                        # Root landing (Redirects to /kiosk)
├── components/                         # Modular UI pieces
│   ├── kiosk/                          # ServiceCards, TouchKeyboard
│   ├── display/                        # AnnouncementBoard, NumberTicker
│   ├── dashboard/                      # AnalyticsCharts, Sidebar, StatCards 
│   └── ui/                             # Reusable atoms (Buttons, Modals, Inputs)
├── fonts/
│   └── fonts.ts                        # Centralized font configurations
├── lib/                                # Core logic & Shared utilities
│   └── supabase/
│       ├── client.ts                   # Supabase client for Client Components
│       └── server.ts                   # Supabase client for Server Components
└── public/                             # Media (icons, images, logos)
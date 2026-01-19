# Frontend Folder Structure

```
peso-frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Dashboard routes group
│   │   │   ├── dashboard/
│   │   │   │   ├── intern/
│   │   │   │   ├── supervisor/
│   │   │   │   ├── coordinator/
│   │   │   │   └── admin/
│   │   │   ├── attendance/
│   │   │   ├── approvals/
│   │   │   └── reports/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── features/           # Feature-specific components
│   │   │   ├── attendance/
│   │   │   ├── approvals/
│   │   │   ├── reports/
│   │   │   └── dashboard/
│   │   └── layout/             # Layout components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Footer.tsx
│   │       ├── DashboardLayout.tsx
│   │       └── AuthLayout.tsx
│   │
│   ├── lib/
│   │   ├── api/                # API client and endpoints
│   │   │   ├── client.ts
│   │   │   └── endpoints.ts
│   │   ├── auth/               # Authentication utilities
│   │   │   └── auth.ts
│   │   ├── constants/          # App constants
│   │   │   └── index.ts
│   │   └── utils.ts            # Utility functions (cn helper from shadcn)
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useAuth.ts
│   │
│   └── assets/                 # Static assets
│       ├── images/
│       └── icons/
│
├── public/                     # Public static files
├── components.json             # shadcn/ui config
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Key Directories

### `/src/app`
Next.js App Router pages and routes. Uses route groups `(auth)` and `(dashboard)` for organization.

### `/src/components`
- **ui/**: shadcn/ui components (Button, Card, Input, etc.)
- **features/**: Domain-specific components organized by feature
- **layout/**: Reusable layout components

### `/src/lib`
- **api/**: API client and endpoint definitions
- **auth/**: Authentication utilities and token management
- **constants/**: Application-wide constants
- **utils/**: Helper functions

### `/src/types`
Centralized TypeScript type definitions for the application.

### `/src/hooks`
Custom React hooks for reusable logic (e.g., `useAuth`, `useAttendance`, etc.).

### `/src/assets`
Static assets like images and icons.

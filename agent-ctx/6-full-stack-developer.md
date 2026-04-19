# Task 6 - Login Page & Admin Layout Components

## Summary
Created two TTE frontend components: login page and admin layout.

## Files Created
1. `/src/components/tte/login-page.tsx` - Login page with government-style design
2. `/src/components/tte/admin-layout.tsx` - Admin layout with responsive sidebar

## Key Details

### Login Page
- Emerald gradient header band with Shield icon
- Title: "Sistem Tanda Tangan Elektronik (TTE)"
- Subtitle: "Masuk ke Panel Admin"
- Username/password fields with show/hide toggle
- Loading state on submit, error message display
- Calls `/api/auth/setup` on mount to ensure admin exists
- Calls `POST /api/auth/login` on submit
- On success: `useAppStore.getState().setIsAuthenticated(true, userData)`
- Default credentials hint shown at bottom

### Admin Layout
- Desktop: w-64 sidebar, collapsible to w-16
- Mobile: Sheet drawer with hamburger trigger
- Navigation: Dashboard, Master Pegawai, Upload & TTD, Dokumen TTD, Pengaturan
- Active page with emerald-700 bg
- Top bar with page title + logout button
- User info in sidebar footer
- Sticky footer: "© 2024 Sistem TTE - Pemerintah Daerah"
- Uses `useIsMobile` hook for responsive switching

## Lint Status
- ESLint: No errors
- Dev server: Compiling successfully

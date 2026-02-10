<<<<<<< HEAD
# ArchaFlow
Architect Management software
=======
# ArchaFlow - Architecture Project Management SaaS

A professional architecture project management platform built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

### 🎨 Design System
- **Resend-inspired design**: Clean black/white aesthetic with high contrast
- **Inter font family**: Professional typography throughout
- **Semantic colors**: Blue for leads, yellow for active stages, green for completed
- **Dark mode**: Full dark mode support (enabled by default)

### 📊 Dashboard
- **Quick Stats**: Active projects, pending invoices, overdue tasks, team workload
- **Kanban Board**: Drag-and-drop project cards across 4 stages (Lead, Sale, Design, Completed)
- **Activity Feed**: Real-time updates on project activities
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

### 🔐 Authentication
- Clean login page with email/password
- Google OAuth integration (UI ready)
- Automatic redirect to dashboard after login

### 🎯 Project Management
- Visual project cards with client info, due dates, assignees
- Payment status tracking (pending, partial, paid)
- Quick actions: notes, attachments, view details
- Real-time drag-and-drop between project stages

### 🎨 UI Components
- Built with shadcn/ui and Radix UI primitives
- Accessible, keyboard-navigable components
- Smooth animations and transitions
- Professional hover states and interactions

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
ArchaFlow/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard with Kanban board
│   ├── globals.css            # Global styles and Tailwind config
│   ├── layout.tsx             # Root layout with Inter font
│   └── page.tsx               # Login page
├── components/
│   └── ui/                    # shadcn/ui components
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       └── dropdown-menu.tsx
├── lib/
│   └── utils.ts               # Utility functions
├── package.json
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Drag & Drop**: @hello-pangea/dnd
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)

## Features Roadmap

### Ready for Integration
- [ ] Supabase authentication
- [ ] Real-time database sync
- [ ] Stripe payment integration
- [ ] File upload to cloud storage
- [ ] Email notifications (Resend)
- [ ] Team collaboration features
- [ ] Advanced reporting and analytics

### Current Mock Data
The dashboard currently uses mock data for:
- 9 sample projects across all stages
- 6 recent activity items
- 4 quick stat cards
- Team member avatars

Replace the mock data in `app/dashboard/page.tsx` with real API calls when ready.

## Customization

### Colors
Edit `app/globals.css` to customize the color scheme. The current palette follows Resend's design system.

### Components
All UI components are in `components/ui/` and can be customized or extended.

### Layout
Modify `app/dashboard/page.tsx` to adjust the dashboard layout, add new sections, or change the Kanban columns.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
>>>>>>> e639225 (Initial commit: ArchaFlow app)

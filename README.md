# 🎓 Vira Coaching Template

**Production-ready template for education coaching platforms** (YKS, LGS, KPSS, bölge üniversiteleri, etc.)

Built with lessons learned from Vira Koç project. Avoids common pitfalls and includes best practices from day 1.

---

## ✨ Features

- ✅ **Responsive font scaling** (1x, 2x, 3x zoom levels) - globally configured
- ✅ **Dark theme system** with multiple theme options (light, sky, anthracite, wine, mint, dark, sapphire)
- ✅ **Supabase authentication** - ready to connect
- ✅ **Database schema** - YKS/education platform specific
- ✅ **TypeScript strict mode** - type-safe from the start
- ✅ **Vercel deployment** - 1-click deploy
- ✅ **Component architecture** - clean folder structure
- ✅ **Storage service** - centralized preferences management
- ✅ **Row-Level Security (RLS)** - built-in Supabase security

---

## 🚀 Quick Start (2-3 hours to production)

### Step 1: Clone and Install

```bash
# Clone this template
git clone https://github.com/espedos/vira-coaching-template.git
cd vira-coaching-template

# Install dependencies
npm install
```

### Step 2: Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **Anon Key**
3. Create `.env.local`:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` and paste your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_NAME=My Coaching Platform
```

### Step 3: Database Setup

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy-paste the contents of `sql/01_create_tables.sql`
4. Run it

The database now has:
- `users` - students and consultants
- `tasks` - weekly schedule, daily tasks
- `deficiencies` - topic gaps to fill
- `schedule_blocks` - exam prep phases
- `messages` - student-consultant communication
- `notifications` - alerts and updates

### Step 4: Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to connect your GitHub repo
```

Vercel will automatically:
- Build your Next.js app
- Connect to your Supabase database
- Deploy and create a live URL

---

## 📋 Lessons Learned (Why This Template Exists)

### ❌ Problem 1: Font Scaling Chaos
**Vira Koç Mistake:** Font scaling logic scattered across components. 15+ commits just to fix it.

**This Template Solution:**
- All typography defined in `src/styles/globals.css`
- Using CSS `clamp()` for responsive sizing
- Scale tier system (1x, 2x, 3x) managed by `StorageService`
- Components stay clean ✨

### ❌ Problem 2: Text Selection in Drag-Drop
**Vira Koç Mistake:** `select-none` applied everywhere, preventing text copying.

**This Template Solution:**
- `select-none` only applies during drag operations
- Normal text remains selectable
- Example:
```tsx
className={`
  ${isBeingDragged 
    ? 'select-none opacity-40'
    : 'select-text'
  }
`}
```

### ❌ Problem 3: Scattered Component Logic
**Vira Koç Mistake:** Components reorganized midway through development.

**This Template Solution:**
```
src/
├── components/
│   ├── common/     # Reusable UI
│   ├── student/    # Student features
│   └── consultant/ # Consultant features
├── pages/          # Next.js routes
├── lib/            # Utilities
├── types/          # TypeScript types
└── styles/         # Global styles
```

### ❌ Problem 4: Database Decisions
**Vira Koç Mistake:** SQL schema trial-and-error.

**This Template Solution:**
- Pre-built Supabase schema in `sql/01_create_tables.sql`
- Includes all tables: users, tasks, deficiencies, schedule_blocks, messages, notifications
- RLS (Row-Level Security) policies built-in
- Indexes optimized for education platforms

---

## 🎯 Architecture Overview

### Font Scaling System

```
User clicks "2x Zoom" in Navbar
          ↓
StorageService.setScreenScale(2)
          ↓
CSS class "scale-tier-2" added to <html>
          ↓
globals.css applies 1.4x multiplier
          ↓
All text grows proportionally
          ↓
No component changes needed! ✨
```

### Data Flow

```
Supabase (Database)
       ↓
supabase.ts (Client)
       ↓
Components (useEffect + state)
       ↓
UI Updates
```

### Storage & State

```
Preferences (theme, scale)
       ↓
localStorage (client-side)
       ↓
StorageService.getTheme()
StorageService.getScreenScale()
       ↓
Applied to DOM on app load
```

---

## 📦 Project Structure

```
vira-coaching-template/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx          # Theme + scale controls
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── student/
│   │   │   ├── Dashboard.tsx
│   │   │   └── TaskCard.tsx
│   │   └── consultant/
│   │       └── Dashboard.tsx
│   ├── pages/
│   │   ├── _app.tsx                # App wrapper
│   │   ├── _document.tsx           # HTML template
│   │   ├── index.tsx               # Home page
│   │   ├── student/
│   │   │   └── [id].tsx            # Student dashboard
│   │   └── consultant/
│   │       └── [id].tsx            # Consultant dashboard
│   ├── lib/
│   │   ├── storage.ts              # StorageService (critical!)
│   │   ├── supabase.ts             # Supabase client
│   │   └── api.ts                  # API utilities
│   ├── types/
│   │   └── index.ts                # All TypeScript types
│   └── styles/
│       ├── globals.css             # Typography + scale system (critical!)
│       └── themes.css              # Theme definitions
├── sql/
│   └── 01_create_tables.sql        # Database schema
├── public/
│   └── favicon.ico
├── .env.example                    # Copy to .env.local
├── .env.local                      # (Create this, don't commit!)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── vercel.json                     # Vercel configuration
├── package.json
└── README.md
```

---

## 🛠️ Development Workflow

### 1. Add a New Component

```bash
# Create component
touch src/components/common/NewComponent.tsx

# Add types if needed
# Edit src/types/index.ts
```

**Best Practice:**
```tsx
import { ThemeMode, ScreenScaleLevel } from '@/lib/storage';

interface Props {
  theme: ThemeMode;
  screenScale: ScreenScaleLevel;
}

export const NewComponent: React.FC<Props> = ({ theme, screenScale }) => {
  // No inline font-size! Use Tailwind classes
  return (
    <div className="text-xs sm:text-sm md:text-base">
      {/* globals.css handles responsive sizing */}
    </div>
  );
};
```

### 2. Query the Database

```tsx
import { supabase } from '@/lib/supabase';
import type { Task } from '@/types';

const getTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) throw error;
  return data as Task[];
};
```

### 3. Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys on every push
# Set environment variables in Vercel Dashboard
# https://vercel.com/dashboard/projects/your-project/settings/environment-variables
```

---

## 🔐 Security

### Row-Level Security (RLS)
All tables have RLS enabled. Users can only access their own data.

```sql
-- Example: Users can only see their own tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid()::text = user_id::text);
```

### Environment Variables
- Never commit `.env.local`
- Keep `NEXT_PUBLIC_SUPABASE_ANON_KEY` - it's public
- Use `.env.example` as a template

---

## 📊 Database Schema

### Users
```sql
id, auth_id, name, email, role, grade, avatar, bio, created_at, updated_at
```

### Tasks
```sql
id, user_id, title, description, start_time, end_time, category, date,
is_completed, is_locked, is_rescheduled, created_at, updated_at
```

### Deficiencies
```sql
id, user_id, subject, description, status (PENDING/ACTIVE/RESOLVED),
created_at, updated_at
```

---

## 🎨 Customization

### Change Theme Colors

Edit `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      primary: '#4f46e5', // Change this
      secondary: '#06b6d4',
    },
  },
}
```

### Add New Theme

Edit `src/lib/storage.ts`:

```ts
export type ThemeMode = 'light' | 'sky' | 'anthracite' | 'wine' | 'mint' | 'dark' | 'sapphire' | 'YOUR_THEME';
```

Then add CSS in `globals.css`.

### Change Scale Levels

Edit `globals.css` `scale-tier-2` and `scale-tier-3` sections.

---

## 📚 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

## 🐛 Troubleshooting

### "Cannot find module '@/lib/storage'"
- Make sure `tsconfig.json` has `"baseUrl": "."` and `"paths": {"@/*": ["src/*"]}`

### Font scaling not working
- Did you run `npm run dev` after changing globals.css?
- Check browser DevTools: is `scale-tier-2` or `scale-tier-3` class on `<html>` element?
- Try hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

### Supabase connection error
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure you ran the SQL migrations
- Check Supabase dashboard for errors

### RLS blocking queries
- Make sure user is authenticated (`auth.uid()` is set)
- Check RLS policies in Supabase dashboard
- Start with permissive policies during development, tighten later

---

## 📝 License

MIT - Use freely for any project

---

## 🚀 From Vira Koç to Your Platform

This template took the best parts of Vira Koç and removed all the trial-and-error. 

**Timeline Improvement:**
- Old way (learning): 1 week
- With this template: 2-3 days

**Quality Improvement:**
- Responsive typography: ✅ from day 1
- Database schema: ✅ from day 1
- TypeScript strict: ✅ from day 1
- Component structure: ✅ from day 1

---

**Ready to build?** Start with Step 1 above. You'll have a working platform in a few hours. 🎉

Questions? Check the troubleshooting section or open an issue on GitHub.

# LAV Dentaire Dental Clinic System - Development Guide

# 🚨 ULTRA-CRITICAL: shadcn/ui ONLY POLICY 🚨

## ⛔ ZERO TOLERANCE RULES - READ FIRST ⛔

**ABSOLUTE REQUIREMENT**: This project uses shadcn/ui components EXCLUSIVELY.

### 🔴 FORBIDDEN (IMMEDIATE REJECTION):
- ❌ ANY custom CSS components
- ❌ ANY external UI libraries (React Bootstrap, Material-UI, Ant Design, etc.)
- ❌ ANY custom button/input/card/modal components
- ❌ ANY styling beyond Tailwind layout utilities
- ❌ ANY icons except Lucide React

### ✅ MANDATORY REQUIREMENTS:
- ✅ EVERY UI element MUST be shadcn component
- ✅ ALL imports from `@/components/ui/*`
- ✅ ALL colors via shadcn CSS variables only
- ✅ ALL forms use shadcn Form components
- ✅ ALL icons from Lucide React

### 🎯 DECISION RULE:
1. **shadcn has it** → MUST use shadcn
2. **shadcn doesn't have it** → DON'T build it (get approval)

### 📋 QUICK CONSISTENCY REFERENCE:
- **Brand titles**: `text-lg font-semibold` (LAV Dentaire everywhere)
- **Icons**: `h-4 w-4` (navigation) | `h-5 w-5` (logos)
- **Logo containers**: `h-10 w-10` (standard)
- **Sections**: `text-base font-semibold`
- **Descriptions**: `text-sm text-muted-foreground`

---

## 📦 REQUIRED SHADCN COMPONENTS (Install ALL)

```bash
npx shadcn-ui@latest add button input label textarea select checkbox radio-group switch table card dialog alert-dialog sheet form dropdown-menu popover tooltip badge alert avatar calendar date-picker tabs accordion navigation-menu breadcrumb pagination skeleton scroll-area separator toast progress command collapsible hover-card menubar context-menu
```

---

## 🎯 QUICK COMPONENT REFERENCE

| Need | Use shadcn Component |
|------|---------------------|
| **Button** | `Button` (variants: default, destructive, outline, secondary, ghost) |
| **Input** | `Input`, `Textarea`, `Select` |
| **Modal** | `Dialog`, `AlertDialog`, `Sheet` |
| **Card** | `Card`, `CardHeader`, `CardContent`, `CardFooter` |
| **Table** | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` |
| **Navigation** | `NavigationMenu`, `Breadcrumb`, `Tabs` |
| **Status** | `Badge`, `Alert`, `Toast`, `Progress` |
| **Form** | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` |
| **Loading** | `Skeleton`, `Button` loading prop |
| **Layout** | `Separator`, `ScrollArea`, `Accordion`, `Collapsible` |

---

## 🏗️ PROJECT OVERVIEW

### Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **UI Library**: shadcn/ui (EXCLUSIVE)
- **Styling**: Tailwind CSS (layout utilities only)
- **Backend**: Supabase
- **Language**: TypeScript
- **Icons**: Lucide React ONLY

### Project Structure
```
src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── treatments/
│   │   ├── analytics/
│   │   └── settings/
│   └── api/
├── components/
│   ├── ui/ (shadcn components)
│   ├── forms/
│   └── charts/
└── lib/
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Setup & Authentication
1. Install Next.js + TypeScript + shadcn/ui
2. Install ALL shadcn components (see list above)
3. **Authentication**: `Form` + `Input` + `Button` + `Card` + `Alert`
4. **Middleware**: Protected routes
5. **Logout**: `AlertDialog` confirmation

### Phase 2: Layout & Navigation
1. **Sidebar**: `NavigationMenu` + `Sheet` (mobile)
2. **Header**: `Avatar` + `DropdownMenu` + `Badge` (notifications)
3. **Breadcrumbs**: `Breadcrumb` components
4. **Loading**: `Skeleton` for all loading states
5. **Errors**: `Alert` + `Toast` for feedback

### Phase 3: Patient Management
1. **List**: `Table` + `Input` (search) + `Select` (filter)
2. **Form**: `Form` + `Input` + `Textarea` + `DatePicker` + `Checkbox`
3. **Profile**: `Card` + `Tabs` + `Badge` + `Avatar`
4. **History**: `Accordion` for medical history

### Phase 4: Appointments
1. **Calendar**: `Calendar` + `Badge` overlays
2. **Booking**: `Form` + `DatePicker` + `Select` + `Textarea`
3. **Status**: `Badge` variants for appointment states
4. **Notifications**: `Toast` for confirmations

### Phase 5: Treatments
1. **Procedures**: `Table` + `Dialog` for management
2. **Selection**: `Checkbox` groups in `Card`
3. **Costs**: `Input` + `Badge` for totals
4. **History**: `Table` + `Pagination`

### Phase 6: QR Registration
1. **Display**: QR in `Card` with `Button`
2. **Form**: Mobile `Form` + `Progress` indicator
3. **Tokens**: `Table` + `Badge` status

### Phase 7: Analytics
1. **Metrics**: `Card` + `Badge` + `Progress`
2. **Charts**: Chart.js wrapped in `Card`
3. **Filters**: `Select` + `DatePicker` + `Tabs`

---

## ❌ CRITICAL VIOLATIONS TO AVOID

```tsx
// ❌ FORBIDDEN: Custom components
const CustomButton = ({ children }) => (
  <div className="bg-blue-500 p-2 rounded">{children}</div>
)

// ❌ FORBIDDEN: External UI libraries
import { Button } from 'react-bootstrap'
import { TextField } from '@mui/material'

// ❌ FORBIDDEN: Custom CSS classes
.custom-card { background: blue; }

// ❌ FORBIDDEN: Inline styles
<div style={{ backgroundColor: 'blue' }}>

// ❌ FORBIDDEN: Tailwind color utilities
<div className="bg-blue-500 text-red-600">
```

```tsx
// ✅ CORRECT: shadcn components only
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

<Card>
  <CardContent className="p-6">
    <Button variant="destructive">Delete</Button>
  </CardContent>
</Card>
```

---

## 🎨 DESIGN SYSTEM: MANDATORY CONSISTENCY STANDARDS

### 📏 SIZING CONSISTENCY

**Icon Sizing Standard:**
- **Navigation Icons**: `h-4 w-4` (sidebar, header, form inputs)
- **Logo Icons**: `h-5 w-5` (brand/logo contexts)
- **Action Icons**: `h-4 w-4` (buttons, notifications, form controls)

**Logo/Brand Containers:**
- **Standard Logo**: `h-10 w-10` (sidebar, login, avatars)
- **Large Logo**: `h-16 w-16` (only for special contexts)

**Layout Spacing:**
- **Header Height**: `h-16` (64px)
- **Sidebar Padding**: `p-6` (24px)
- **Card Spacing**: `space-y-4` or `space-y-6`
- **Icon Gaps**: `gap-3` consistently used

### ✍️ TYPOGRAPHY HIERARCHY

**MANDATORY Font Sizes:**

| Element Type | Size Class | Pixel Size | Use Case |
|--------------|------------|------------|----------|
| **Brand Titles** | `text-lg font-semibold` | 18px | LAV Dentaire brand |
| **Dialog Titles** | `text-xl font-semibold` | 20px | Modal/dialog headers |
| **Section Headers** | `text-base font-semibold` | 16px | Form sections |
| **Body Text** | `text-sm` | 14px | Content, descriptions |
| **Small Text** | `text-xs text-muted-foreground` | 12px | Metadata, timestamps |

**Typography Rules:**
- ✅ **Brand consistency**: All "LAV Dentaire" uses `text-lg font-semibold`
- ✅ **Descriptions**: Always `text-sm text-muted-foreground`
- ✅ **Form sections**: Use `text-base font-semibold`
- ❌ **Never use**: `text-2xl`, `text-3xl`, or custom font sizes
- ❌ **Avoid**: `font-bold` (use `font-semibold` instead)

### 🎨 COLORS: shadcn CSS Variables ONLY

```css
/* ✅ ONLY use these shadcn variables */
hsl(var(--background))
hsl(var(--foreground))
hsl(var(--primary))
hsl(var(--secondary))
hsl(var(--muted))
hsl(var(--border))
hsl(var(--destructive))
```

### 🧩 COMPONENT CONSISTENCY

**Sidebar Standards:**
- Logo: `h-10 w-10` + `h-5 w-5` icon + `text-lg font-semibold`
- Navigation: `h-4 w-4` icons + `text-sm`
- Collapsed state: 80px width, expanded: 240px width

**Header Standards:**
- Height: `h-16`
- Toggle button: `h-4 w-4` Menu icon
- All action icons: `h-4 w-4`

**Login Standards:**
- Logo matches sidebar: `h-10 w-10` + `h-5 w-5` icon
- Brand title: `text-lg font-semibold`
- Form sections: `text-base font-semibold`

**Form Standards:**
- Input icons: `h-4 w-4`
- Labels: Standard shadcn FormLabel
- Descriptions: `text-sm text-muted-foreground`

### 🚨 CONSISTENCY ENFORCEMENT

**Before ANY development:**
1. Check existing sizing patterns
2. Follow established typography scale
3. Use only approved icon sizes
4. Maintain spacing consistency

**Zero tolerance for:**
- ❌ Custom font sizes outside the scale
- ❌ Inconsistent icon sizing
- ❌ Random spacing values
- ❌ Brand title size variations

---

## 🔍 ENFORCEMENT CHECKLIST

### Before Development:
- [ ] All shadcn components installed
- [ ] No external UI libraries in package.json
- [ ] Review design system standards above
- [ ] Check existing sizing/typography patterns

### During Development:
- [ ] Every UI element is shadcn component
- [ ] All imports from `@/components/ui/*`
- [ ] No custom CSS beyond layout utilities
- [ ] All colors use shadcn variables
- [ ] **Icons follow size standards**: `h-4 w-4` navigation, `h-5 w-5` logos
- [ ] **Typography follows hierarchy**: Brand=`text-lg`, Sections=`text-base`, Body=`text-sm`
- [ ] **Spacing is consistent**: `p-6`, `gap-3`, `space-y-4/6`
- [ ] **Logo sizing uniform**: `h-10 w-10` containers everywhere

### Code Review:
- [ ] Zero custom components
- [ ] Perfect visual consistency
- [ ] All icons from Lucide React
- [ ] **Design system compliance**: Typography, sizing, spacing match standards
- [ ] **Brand consistency**: All "LAV Dentaire" uses same sizing/fonts

---

## 🚨 ENFORCEMENT: Any violation = IMMEDIATE STOP and fix

**REMEMBER**: Project success depends on ABSOLUTE shadcn consistency!
- CLAUDE.md
- DEVELOPMENT-PLAN.md
- CLAUDE.md
- DEVELOPMENT-PLAN.md
- CLAUDE.md
- DEVELOPMENT-PLAN.md
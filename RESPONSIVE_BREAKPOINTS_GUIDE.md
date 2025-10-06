# Responsive Breakpoints Visual Guide

## 📐 Breakpoint Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RESPONSIVE BREAKPOINTS                            │
└─────────────────────────────────────────────────────────────────────────┘

   0px          475px        640px        768px       1024px      1280px      1536px
    │             │            │            │            │           │           │
    ├─────────────┤            │            │            │           │           │
    │     xs      │            │            │            │           │           │
    │ (portrait)  │            │            │            │           │           │
    │   phones    │            │            │            │           │           │
    │             │            │            │            │           │           │
    ├─────────────┼────────────┤            │            │           │           │
    │             │     sm     │            │            │           │           │
    │             │  (small    │            │            │           │           │
    │             │   tablets) │            │            │           │           │
    │             │            │            │            │           │           │
    ├─────────────┼────────────┼────────────┤            │           │           │
    │             │            │     md     │            │           │           │
    │             │            │ (tablets)  │            │           │           │
    │             │            │            │            │           │           │
    │             │            │            │            │           │           │
    ├─────────────┼────────────┼────────────┼────────────┤           │           │
    │             │            │            │     lg     │           │           │
    │             │            │            │  (laptops) │           │           │
    │             │            │            │            │           │           │
    │             │            │            │            │           │           │
    ├─────────────┼────────────┼────────────┼────────────┼───────────┤           │
    │             │            │            │            │    xl     │           │
    │             │            │            │            │ (desktop) │           │
    │             │            │            │            │           │           │
    │             │            │            │            │           │           │
    ├─────────────┼────────────┼────────────┼────────────┼───────────┼───────────┤
    │             │            │            │            │           │    2xl    │
    │             │            │            │            │           │  (large)  │
    │             │            │            │            │           │           │
    └─────────────┴────────────┴────────────┴────────────┴───────────┴───────────┘
```

## 📱 Common Devices

### Extra Small (xs: 475px)
```
┌───────────┐
│ iPhone SE │  320×568 - 375×667
│   Galaxy  │  360×640
│   S8+     │
└───────────┘
```

### Small (sm: 640px)
```
┌─────────────┐
│ Large Phone │  390×844 - 430×932
│  iPhone 12  │
│  iPhone 14  │
└─────────────┘
```

### Medium (md: 768px)
```
┌───────────────┐
│  iPad Mini    │  768×1024
│  Small Tablet │
└───────────────┘
```

### Large (lg: 1024px)
```
┌─────────────────┐
│   iPad Pro      │  1024×1366
│   Large Tablet  │
│   Small Laptop  │
└─────────────────┘
```

### Extra Large (xl: 1280px)
```
┌───────────────────┐
│     Desktop       │  1280×720 - 1440×900
│   Standard Laptop │
└───────────────────┘
```

### 2X Large (2xl: 1536px)
```
┌─────────────────────┐
│   Large Desktop     │  1920×1080+
│   High-res Display  │
└─────────────────────┘
```

## 🎨 Layout Examples

### Grid Layouts

#### Mobile First (< 640px):
```
┌─────────────────┐
│   1 Column      │
│                 │
│  ┌───────────┐  │
│  │  Item 1   │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │  Item 2   │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │  Item 3   │  │
│  └───────────┘  │
└─────────────────┘
```

#### Small (640px+):
```
┌─────────────────────────┐
│     2 Columns           │
│                         │
│  ┌──────┐  ┌──────┐    │
│  │Item 1│  │Item 2│    │
│  └──────┘  └──────┘    │
│  ┌──────┐  ┌──────┐    │
│  │Item 3│  │Item 4│    │
│  └──────┘  └──────┘    │
└─────────────────────────┘
```

#### Large (1024px+):
```
┌─────────────────────────────────┐
│        3 Columns                 │
│                                  │
│  ┌────┐  ┌────┐  ┌────┐        │
│  │ 1  │  │ 2  │  │ 3  │        │
│  └────┘  └────┘  └────┘        │
│  ┌────┐  ┌────┐  ┌────┐        │
│  │ 4  │  │ 5  │  │ 6  │        │
│  └────┘  └────┘  └────┘        │
└─────────────────────────────────┘
```

## 🔤 Typography Scale

### Headings:
```
Mobile (< 768px)     →     Desktop (768px+)

h1:  1.5rem (24px)   →     3rem (48px)
h2:  1.25rem (20px)  →     2.25rem (36px)
h3:  1.125rem (18px) →     1.875rem (30px)
p:   0.875rem (14px) →     1rem (16px)
```

### Button Sizes:
```
Mobile              →     Desktop

Small:  py-2 px-3   →     py-2.5 px-4
Normal: py-2.5 px-4 →     py-3 px-6
Large:  py-3 px-6   →     py-4 px-8
```

## 📏 Spacing Scale

### Padding:
```
Mobile (< 768px)     →     Desktop (768px+)

Extra Small: p-2     →     p-3
Small:       p-3     →     p-4
Medium:      p-4     →     p-6
Large:       p-6     →     p-8
Extra Large: p-8     →     p-12
```

### Gaps:
```
Mobile              →     Desktop

Cards:  gap-3       →     gap-6
Grid:   gap-4       →     gap-8
Flex:   gap-2       →     gap-4
```

## 🎯 Touch Targets

### Minimum Sizes (WCAG AAA):
```
┌──────────────────────┐
│   Minimum Touch      │
│      Target          │
│                      │
│   ┌──────────┐      │
│   │  44×44px │      │
│   │   Area   │      │
│   └──────────┘      │
│                      │
│   Better: 48×48px    │
└──────────────────────┘
```

## 🔄 Responsive Patterns

### Stack to Columns:
```
Mobile (< 768px):        Desktop (768px+):

┌─────────────┐          ┌─────────┬─────────┐
│   Header    │          │ Sidebar │ Content │
├─────────────┤    →     │         │         │
│   Content   │          │         │         │
├─────────────┤          │         │         │
│   Sidebar   │          └─────────┴─────────┘
└─────────────┘
```

### Hide/Show Elements:
```
Mobile (< 768px):        Desktop (768px+):

┌─────────────┐          ┌────────────────────┐
│  [☰] Menu   │          │ Logo | Nav | User  │
├─────────────┤    →     ├────────────────────┤
│             │          │                    │
│   Content   │          │      Content       │
│             │          │                    │
└─────────────┘          └────────────────────┘
```

## 💡 Usage Examples

### Responsive Text:
```jsx
// Scales from mobile to desktop
<h1 className="
  text-2xl    // Mobile (24px)
  sm:text-3xl // Small (30px)
  md:text-4xl // Medium (36px)
  lg:text-5xl // Large (48px)
">
  Heading
</h1>
```

### Responsive Padding:
```jsx
// Increases padding on larger screens
<div className="
  p-3         // Mobile (12px)
  sm:p-4      // Small (16px)
  md:p-6      // Medium (24px)
  lg:p-8      // Large (32px)
">
  Content
</div>
```

### Responsive Grid:
```jsx
// 1 column → 2 columns → 3 columns
<div className="
  grid
  grid-cols-1       // Mobile (1 column)
  sm:grid-cols-2    // Small (2 columns)
  lg:grid-cols-3    // Large (3 columns)
  gap-4
">
  {items}
</div>
```

### Show/Hide:
```jsx
// Desktop navigation
<nav className="hidden lg:flex">
  {/* Desktop menu items */}
</nav>

// Mobile navigation
<nav className="lg:hidden">
  {/* Mobile menu items */}
</nav>
```

## 📊 Testing Matrix

### Devices × Orientations:
```
                Portrait    Landscape
iPhone SE       ✓          ✓
iPhone 12       ✓          ✓
iPad Mini       ✓          ✓
iPad Pro        ✓          ✓
Desktop         N/A        ✓
```

### Browsers × Devices:
```
                Chrome  Safari  Firefox
Mobile          ✓      ✓       ✓
Tablet          ✓      ✓       ✓
Desktop         ✓      ✓       ✓
```

## 🎨 Visual Hierarchy

### Mobile First:
```
┌─────────────────┐
│   Most Important│  ← Largest
│   ============  │
│                 │
│   Important     │  ← Medium
│   --------      │
│                 │
│   Details       │  ← Smaller
└─────────────────┘
```

## 🚀 Quick Reference

### Breakpoint Classes:
```css
/* No prefix = Base (mobile) */
text-sm

/* sm: = Small (640px+) */
sm:text-base

/* md: = Medium (768px+) */
md:text-lg

/* lg: = Large (1024px+) */
lg:text-xl

/* xl: = Extra Large (1280px+) */
xl:text-2xl

/* 2xl: = 2X Extra Large (1536px+) */
2xl:text-3xl
```

### Common Patterns:
```jsx
// Text sizing
className="text-sm sm:text-base md:text-lg"

// Spacing
className="p-4 md:p-6 lg:p-8"

// Layout
className="flex-col md:flex-row"

// Grid
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Visibility
className="hidden lg:block"
```

---

**Remember**: Always start with mobile and progressively enhance for larger screens!

For more details, refer to:
- MOBILE_RESPONSIVENESS_UPDATE.md
- MOBILE_TESTING_GUIDE.md
- MOBILE_SUMMARY.md

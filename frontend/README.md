# Jo Jo Frontend

## Overview

Jo Jo is a PDF-whispering bestie! This frontend is built with React, TypeScript, and Tailwind CSS, optimized for performance and production.

## Features

- PDF upload with progress tracking
- Document history with lazy-loaded components
- Real-time chat interface
- Responsive design with Tailwind CSS

## Performance Optimizations

- React.memo and useCallback for component memoization
- React.lazy and Suspense for code splitting
- Tailwind CSS purge for minimal CSS bundle
- TypeScript for type safety and better developer experience

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── App.tsx
├── config.ts
├── env.d.ts
├── hooks/
│   └── useUpload.ts
├── index.css
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── main.tsx
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── ChatPanel.tsx
│       ├── HistorySidebar.tsx
│       ├── UploadCard.tsx
│       └── upload-states/
│           ├── UploadEmpty.tsx
│           ├── UploadError.tsx
│           ├── UploadProgress.tsx
│           └── UploadSuccess.tsx
├── __tests__/
│   └── App.test.tsx
├── services/
│   └── api.ts
```

## Configuration

- `tailwind.config.js`: Tailwind CSS configuration with purge
- `postcss.config.js`: PostCSS configuration for Tailwind
- `package.json`: Project metadata and dependencies
- `index.html`: HTML entry point with correct title

## Deployment

Ready for Vercel deployment with optimized build and minimal bundle size.

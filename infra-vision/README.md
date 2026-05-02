---
title: InfraVision
emoji: 🏙️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# InfraVision - Smart City Analytics Platform

A Next.js 14 full-stack dashboard with Prisma, Tailwind CSS, TypeScript, and AI-powered city infrastructure analysis.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 📁 Project Structure

```
infra-vision/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── ai-features/       # AI Features showcase
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ai-features/       # AI Features components
│   └── MapCanvas.tsx      # Map component
├── lib/                   # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   └── s3.ts              # AWS S3 utilities
├── prisma/                # Prisma schema
│   └── schema.prisma      # Database schema
└── public/                # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Prisma)
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, shadcn/ui
- **Animations**: Motion (Framer Motion)
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Key Features

- 🏙️ City Infrastructure Analysis
- 📊 Advanced Data Visualization
- 🗺️ Smart Road & Housing Planning
- 📈 Urban Growth Pattern Prediction
- 🌱 Sustainability & Green Planning
- 🔐 User Authentication
- 📱 Responsive Design

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/infra_vision"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token"

# AWS S3 / Cloudflare R2 (optional)
R2_PUBLIC_URL="your-r2-url"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"
```

### Prisma Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations

## 🎨 AI Features Integration

The AI Features section is located at `/ai-features` and showcases:

- Smart City Features
- City Infrastructure Analyzer
- Road & Housing Planning
- Data Visualization
- Urban Growth Patterns
- Sustainability Planning

See `COPY_COMPONENTS.md` for instructions on copying the full design components.

## 🐛 Troubleshooting

### Common Issues

1. **Module not found**: Run `npm install` again
2. **Prisma errors**: Run `npx prisma generate`
3. **Tailwind not working**: Check `tailwind.config.js` and restart dev server
4. **TypeScript errors**: Check `tsconfig.json` paths

## 📚 Documentation

- `SETUP_COMPLETE.md` - Complete setup guide
- `COPY_COMPONENTS.md` - Instructions for copying design components

## 📄 License

Private project - All rights reserved











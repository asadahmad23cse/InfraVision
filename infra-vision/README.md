---
title: InfraVision
emoji: 🏙️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

<div align="center">
  <img src="./assets/hero.png" alt="InfraVision Hero" width="800">
  <h1>🏙️ InfraVision</h1>
  <p><strong>Next-Generation Smart City Analytics & Urban Planning Platform</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
</div>

---

## 📖 Overview

**InfraVision** is a comprehensive full-stack solution designed for urban planners, city administrators, and developers to analyze, visualize, and predict city infrastructure growth. Leveraging AI-powered insights and high-fidelity data visualization, InfraVision transforms raw urban data into actionable strategies for smarter, more sustainable cities.

### 🎥 Visual Deep Dive
<div align="center">
  <img src="./assets/analytics.png" alt="InfraVision Analytics" width="700">
  <p><em>Advanced 3D Heatmaps and Urban Growth Analytics Dashboard</em></p>
</div>

---

## 🏗️ System Architecture

```mermaid
graph TD
    User((User/Planner)) -->|Interacts| Frontend[Next.js 14 Dashboard]
    Frontend -->|API Requests| Backend[Next.js API Routes]
    Backend -->|Auth| NextAuth[NextAuth.js]
    Backend -->|Query| ORM[Prisma ORM]
    ORM -->|Data| DB[(PostgreSQL)]
    Backend -->|Analysis| AI[AI Planning Engine]
    AI -->|Predictive Insights| Backend
    Frontend -->|Visualization| Recharts[Recharts & Framer Motion]
    Frontend -->|Mapping| Mapbox[Mapbox GL JS]
```

---

## 🌟 Key Features

### 🏙️ City Infrastructure Analysis
Deep-dive into existing city assets. Identify bottlenecks in traffic, utility coverage, and public services using multi-layered map overlays.

### 📊 Advanced Data Visualization
Dynamic charts and 3D heatmaps provide a clear view of urban density, resource consumption, and demographic trends.

### 🗺️ Smart Road & Housing Planning
Simulate new infrastructure projects. Our AI models evaluate the impact of new roads or housing complexes on existing traffic and environmental health.

### 📈 Urban Growth Prediction
Predict where the city will expand next. Using historical data and machine learning, InfraVision forecasts growth patterns to help in proactive planning.

### 🌱 Sustainability & Green Planning
Optimize for a greener future. Track carbon footprints, analyze green space distribution, and plan for renewable energy integration.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS |
| **Backend** | Node.js, Next.js API Routes |
| **Database** | PostgreSQL with Prisma ORM |
| **Auth** | NextAuth.js |
| **Visualization** | Recharts, Mapbox GL JS, Framer Motion |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js 18+ 
- PostgreSQL Database
- Mapbox Access Token

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/asadahmad23cse/InfraVision
   cd infra-vision
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/infra_vision"
   NEXTAUTH_SECRET="your-secret"
   NEXT_PUBLIC_MAPBOX_TOKEN="your-token"
   ```

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Launch Development Server**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
infra-vision/
├── app/                # Next.js App Router (Pages & API)
├── components/         # Reusable UI & Feature Components
├── lib/                # Shared utilities (Prisma, Auth, S3)
├── prisma/             # Database Schema & Migrations
├── public/             # Static Assets
└── assets/             # Documentation Media
```

---

## 📄 License
Private project - All rights reserved. 

<div align="center">
  <p>Built with ❤️ for Smarter Cities</p>
</div>

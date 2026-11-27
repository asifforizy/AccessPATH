# AccessPath – Advanced Urban Accessibility & Mobility Platform

<p align="center">
  <strong>Making cities more accessible, one journey at a time.</strong>
</p>

<p align="center">
  <a href="https://YOUR-ACCESSPATH-LIVE-URL.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20AccessPath-16A34A?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="YOUR-GITHUB-REPOSITORY-URL">
    <img src="https://img.shields.io/badge/GitHub-Source%20Code-181717?style=for-the-badge&logo=github" alt="GitHub Repository" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express.js-Backend-000000?logo=express" alt="Express.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" alt="Prisma" />
</p>

---

## Overview

**AccessPath** is an accessibility-focused urban mobility platform designed to help wheelchair users, elderly people, and individuals with mobility challenges discover accessible locations and navigate cities more safely.

Traditional navigation applications primarily optimize routes based on distance and travel time. However, the shortest route is not always the most accessible route.

AccessPath addresses this problem by considering real-world accessibility conditions such as:

- Wheelchair accessibility and ramp availability.
- Elevators and stair-free entrances.
- Broken footpaths and blocked sidewalks.
- Unsafe pedestrian crossings.
- Accessible parking and restrooms.
- Community-reported accessibility barriers.

The platform combines geospatial search, interactive maps, accessibility-aware route recommendations, and community-driven verification to make urban environments more inclusive.

## Live Application

**Explore AccessPath:** https://YOUR-ACCESSPATH-LIVE-URL.vercel.app

> Replace this URL with your actual deployed application URL.


## Demo Accounts

You can explore AccessPath using the following demo accounts.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@accesspath.dev` | `AccessPath#2026` |
| Regular User | `zxcvbnm87522@gmail.com` | `Saifur1212*` |


**Note:** These are demonstration credentials intended for testing the application's role-based features. Do not use these accounts for real or sensitive information.

## Key Features

### 1. Accessible Location Directory
- Discover accessible public buildings, parks, educational institutions, transportation facilities, and government offices.
- Search locations by name and address.
- Filter locations by category and accessibility features.
- Sort results by distance and accessibility score.
- View detailed location information and photographs.

### 2. Accessibility Information
Each location provides accessibility information, including:

- Wheelchair access.
- Ramp availability.
- Elevator availability.
- Accessible restrooms.
- Accessible parking.
- Stair-free entry.
- Door accessibility.
- Accessibility score and verification status.

Unknown accessibility information is clearly distinguished from confirmed accessibility information.

### 3. Interactive Map & Geospatial Search
- Explore locations using an interactive map.
- Discover nearby accessible places.
- Search using geographic coordinates.
- Filter map results by accessibility features.
- Display location markers and clusters.
- View location details directly from the map.

### 4. Accessibility-Aware Route Discovery
AccessPath aims to prioritize accessibility rather than simply recommending the shortest route.

Route evaluation considers:
- Route distance.
- Estimated travel time.
- Ramp availability.
- Elevator availability.
- Staircases and other physical barriers.
- Broken footpaths.
- Unsafe crossings.
- Overall accessibility score.

Users can compare available routes and review accessibility warnings before starting their journey.

### 5. Barrier Reporting System
Users and contributors can report accessibility problems, including:

- Broken footpaths.
- Missing ramps.
- Blocked sidewalks.
- Broken elevators.
- Unsafe crossings.

Reports can include descriptions, photographs, GPS coordinates, submission dates, and verification status.

### 6. Community Verification
AccessPath supports community-driven accessibility information management.

- Submit accessibility feedback.
- Review existing location information.
- Contribute new locations.
- Update accessibility details.
- Verify submitted reports.
- Approve or reject location submissions.
- Track contribution history.

### 7. Role-Based Access Control

The platform supports four primary roles:

| Role | Permissions |
|---|---|
| Admin | Manage users, locations, categories, reports, settings, and analytics. |
| Regular User | Explore locations, discover routes, save favorites, and report barriers. |
| Contributor | Submit locations, update accessibility information, upload photographs, and track contributions. |
| Moderator | Review submissions, verify locations, approve or reject reports, and manage incorrect information. |

### 8. Analytics Dashboard
Administrators can monitor platform activity through analytics, including:

- Total accessible locations.
- Total barrier reports.
- Verified and pending reports.
- Most reported areas.
- Accessibility category distribution.
- Monthly report trends.
- Community contribution statistics.

---

## Technology Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React

### Backend
- Node.js
- Express.js
- TypeScript
- REST API

### Database & ORM
- PostgreSQL
- Prisma ORM
- Geospatial data management

### Maps & Geospatial Technologies
- MapLibre GL JS
- OpenStreetMap
- Turf.js
- Supercluster

### Additional Technologies
- Authentication and role-based authorization
- Image upload and storage
- Data validation
- Interactive data visualization
- Responsive UI design

---

## Route Accessibility Scoring

Unlike conventional navigation systems, AccessPath considers accessibility conditions when evaluating routes.

The scoring algorithm considers positive and negative factors.

| Condition | Score Impact |
|---|---|
| Shorter distance | Positive |
| Ramp available | Positive |
| Elevator available | Positive |
| Staircase | Negative |
| Broken footpath | Negative |
| Unsafe crossing | Negative |

The system evaluates route conditions and ranks available routes using accessibility-related factors alongside distance.

**Important:** The scoring weights are configurable and should be documented and validated against real accessibility requirements. Unknown or unverified information should not be treated as confirmed accessibility.

---

## Security & Data Integrity

AccessPath follows role-based authorization and data validation principles.

- Users can manage their own contributions.
- Contributors cannot approve their own submissions.
- Only authorized moderators and administrators can verify locations.
- Users cannot modify other users' reports.
- GPS coordinates are validated.
- Location records maintain geographic information.
- Route recommendations prioritize verified accessibility information.
- Unverified information is clearly identified.
- Favorites are associated with individual user accounts.

---

## Project Structure

The project is organized into separate frontend and backend applications.

```text
AccessPath/
│
├── accesspath-frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── public/
│
├── accesspath-backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   └── config/
│   ├── prisma/
│   └── package.json
│
└── README.md
```

*Adjust the directory names and structure to match your actual repository.*

---

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js (LTS)
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone YOUR-GITHUB-REPOSITORY-URL
cd AccessPath
```

### 2. Setup the Backend

```bash
cd accesspath-backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
DATABASE_URL="your_postgresql_connection_string"
APP_URL="http://localhost:3000"
```

Configure any additional environment variables required by your backend.

Run database migrations and start the backend:

```bash
npx prisma migrate dev
npm run dev
```

### 3. Setup the Frontend

Open another terminal:

```bash
cd accesspath-frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_API_URL=http://localhost:5000
```

Configure any additional environment variables required by your frontend.

Start the development server:

```bash
npm run dev
```

### 4. Open the Application

Visit:

```text
http://localhost:3000
```

---

## Future Improvements

- Personalized accessibility preferences.
- Advanced wheelchair-friendly route recommendations.
- Accessibility heatmaps.
- Community trust scoring.
- Automatic duplicate location detection.
- Location accessibility ranking.
- Offline saved locations.
- Voice-based location search.
- PDF accessibility reports.
- Improved real-time accessibility updates.

---

## Project Goals

AccessPath aims to demonstrate how modern web technologies, geospatial systems, and community-driven data can help solve real-world accessibility challenges.

The primary objective is to build a platform that prioritizes **accessibility, safety, and inclusive mobility over conventional distance-based navigation**.

---

## Author

**MD Saifur Rahaman Asif**

- Portfolio: https://asifforizy.netlify.app/
- GitHub: https://github.com/asifforizy

---

<p align="center">
  <strong>AccessPath — Accessible Cities, Better Journeys.</strong>
</p>
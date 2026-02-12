# Pentagon Stats

A sleek, futuristic dashboard to visualize student academic performance using a Pentagon (Radar) Chart.

## Features

- **Futuristic UI**: Dark mode, neon accents, glassmorphism, and smooth animations.
- **Radar Chart ("The Pentagon")**: Visualizes marks across subjects to show strengths and weaknesses at a glance.
- **Detailed Grid**: Breakdown of marks, grades, and credits.
- **Real-time Search**: Fetches data dynamically from the college API.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4, Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## Usage

1.  Enter a valid Roll Number (e.g., `25MVCSDR0548`).
2.  Click "ANALYZE".
3.  View the Pentagon Chart and detailed marks.

## Project Structure

-   `src/app/page.tsx`: Main dashboard logic and layout.
-   `src/components/stats-chart.tsx`: Radar chart component.
-   `src/components/stats-grid.tsx`: Marks list component.
-   `src/actions`: Server actions for API data fetching.
-   `src/types`: TypeScript definitions for API responses.

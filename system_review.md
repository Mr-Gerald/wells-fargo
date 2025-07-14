# System Review: Wells Fargo Clone

## 1. Overview

This document provides a high-level technical overview of the Wells Fargo mobile application clone. The project is a high-fidelity, interactive prototype built as a single-page application (SPA) to mimic the user experience of a real banking app.

## 2. Architecture & Technology Stack

- **Framework**: React v19 with TypeScript. React is used for its component-based architecture, enabling the creation of a modular and maintainable UI. TypeScript adds static typing for improved code quality and developer experience.
- **Routing**: `react-router-dom` v7. It handles all client-side routing, enabling seamless navigation between different "pages" (components) without full page reloads, which is crucial for a native-app feel. `HashRouter` is used for compatibility with static hosting environments.
- **Styling**: Tailwind CSS. A utility-first CSS framework is used for rapid and consistent styling. A minimal custom theme (e.g., `wells-red`) is configured directly in `index.html`.
- **State Management**: Primarily local component state (`useState`, `useEffect`). For simplicity in this prototype, global state management libraries (like Redux or Zustand) are not used. State is passed down through props.
- **Data**: All application data (accounts, transactions, FICO scores, etc.) is mocked and stored as constants in `constants.tsx`. This allows for rapid prototyping without a backend dependency.

## 3. Component Structure

The application is broken down into a series of reusable components located in the `components/` directory.

### Core Components:
- **`App.tsx`**: The root component. It manages the main application state (like `isLoggedIn`) and sets up the React Router configuration, defining all navigable routes. It also wraps the authenticated view in a consistent mobile frame.
- **`LoginPage.tsx`**: The entry point for unauthenticated users. It presents the sign-on form.
- **`DashboardPage.tsx`**: The main screen after login. It provides an overview of all user accounts and other key financial summaries like the FICO® score.
- **`AccountDetailsPage.tsx`**: Shows the transaction history and management options for a single selected account.
- **`TransactionReceiptPage.tsx`**: Displays the full details of a single transaction.
- **`FicoScorePage.tsx`**: A detailed view of the user's credit score, with data visualizations.

### Navigation Components:
- **`Header.tsx`**: The main header for the dashboard, displaying a greeting and a functional notification panel.
- **`PageHeader.tsx`**: A reusable header for all sub-pages, providing a back button and a title for consistent UX.
- **`BottomNav.tsx`**: The application's primary navigation tool, fixed to the bottom of the screen.

### Reusable/UI Components:
- **`FicoScoreCard.tsx`**: A card component displayed on the dashboard that links to the full FICO page.
- **`PlaceholderPage.tsx`**: A generic component used for all tertiary-level pages to demonstrate a deep navigation structure without creating redundant code.
- **Icons**: All SVG icons are defined as React components in `constants.tsx` for easy reuse and styling.

## 4. Data Flow

1.  **Authentication**: `App.tsx` holds the `isLoggedIn` state. `LoginPage` calls the `onLogin` prop to update this state, causing a re-render that displays the main application. Logging out from the `Header` component reverses this process.
2.  **Navigation**: The user navigates using `Link` components in `BottomNav`, `DashboardPage`, `AccountDetailsPage`, etc. React Router intercepts these clicks and renders the appropriate page component based on the route definitions in `App.tsx`.
3.  **Data Display**: Page components (e.g., `DashboardPage`) import data directly from `constants.tsx`. When navigating to a page that requires a specific item (e.g., an account), the ID is passed via URL parameters (`/account/:id`). The child component (`AccountDetailsPage`) uses the `useParams` hook to retrieve the ID and filter the appropriate data from the main constants file.

## 5. Project Structure

```
/
├── index.html          # Main HTML entry point, includes CDN links and root div
├── index.tsx           # React application entry point
├── metadata.json       # Application metadata
├── types.ts            # TypeScript type definitions (interfaces, enums)
├── constants.tsx       # Mock data and SVG icon components
├── App.tsx             # Root component with routing
├── changelog.md        # Project version history
└── system_review.md    # This file
│
└── components/
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── Header.tsx
    ├── BottomNav.tsx
    └── ... (all other components)
```

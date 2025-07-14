# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-07-09

### Added
- **Project Documentation**: Created `changelog.md` and `system_review.md` for project tracking and architectural overview.
- **"Wealthy Client" Persona**: Overhauled all mock data to reflect a high-net-worth individual.
  - Checking account balance updated to **$532,403.93**.
  - Loan accounts replaced with a High-Yield Savings account with **$2,163,853.98**.
  - Generated extensive, realistic transaction histories for both accounts.
- **Functional Notifications**: Implemented a fully functional notification panel accessible via the bell icon in the header.
- **Expanded Navigation**: Added a new "Explore" section to the bottom navigation bar.
- **Deeply Interactive Pages**: Made all items on the "Deposit," "Pay & Transfer," and "Menu" pages clickable links that navigate to their own dedicated pages.
- **New Placeholder Pages**: Created a reusable placeholder page component to handle the new sub-navigation links.
- **New Explore Page**: Built out the "Explore" page with links to various financial products.

### Changed
- **UI Consistency**: Aligned the FICO® score on the dashboard card (820) with the detailed FICO score page.
- **UI Polish**: Increased the vertical font size of the "Good morning" greeting for better visual hierarchy.
- **Bottom Navigation**: Layout updated to support five items.

## [0.1.0] - 2024-07-08

### Added
- **Initial Build**: Created the initial Wells Fargo mobile application clone.
- **Core Features**:
  - Login Page with authentication flow.
  - Dashboard Page displaying a summary of accounts.
  - Account Details Page with a list of recent transactions.
  - Transaction Receipt Page showing details for a single transaction.
  - Detailed FICO® Score Page with a gauge, history graph, and score ingredients.
- **Core Technologies**:
  - React with TypeScript
  - Tailwind CSS for styling
  - `react-router-dom` for navigation

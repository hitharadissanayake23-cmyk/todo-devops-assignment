# Todo DevOps Assignment

## Group Information
- **Hithara Dissanayaka** - ITBIN-2414-0023 - Role: DevOps/Release Manager
- **L Liyanagunawardhana** - ITBIN-2414-0012 - Role: Backend Developer
- **Hemshani Thennakoon** - ITBIN-2414-0021 - Role: Frontend Developer

## Project Description
This project is a simple **Todo application** designed to demonstrate DevOps practices, CI/CD pipelines, and deployment automation.  
The core value proposition is to provide a lightweight task management solution while showcasing modern software engineering workflows.

## Live Deployment
🔗 **Live URL:** https://todo-devops-assignment-eight.vercel.app

## Technologies Used
- HTML5 / CSS3 / JavaScript
- [Frameworks/Libraries: e.g., React, TailwindCSS]
- GitHub Actions (CI/CD)
- Vercel (Deployment Platform)

## Features
- **Add Tasks**: Users can add new todos with ease.
- **Mark Complete**: Tasks can be marked as completed.
- **Delete Tasks**: Remove tasks from the list.
- **Responsive UI**: Works seamlessly across devices.

## Branch Strategy
We followed a standard Git Flow branching model:
- `main` → Production branch (protected, auto-deploys on commit)
- `develop` → Development & integration branch (prerelease testing)
- `feature/*` → Individual developer work branches

## Individual Contributions
### Hithara Dissanayaka
- Initial repository structure and branch protection rules setup.
- Configured GitHub Actions CI/CD workflows (`ci.yml` & `deploy.yml`).
- Managed deployment pipeline and release strategy.

### L Liyanagunawardhana
- Implemented backend logic for task management.
- Handled API endpoints and server-side validation.
- Contributed to database integration and testing.

### Hemshani Thennakoon
- Designed and developed the frontend UI.
- Implemented responsive layout and styling.
- Integrated frontend with backend APIs.

## Setup & Installation Instructions

### Prerequisites
- Node.js (version 18 or higher)
- Git installed locally

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/hitharadissanayake23-cmyk/todo-devops-assignment.git

# Todo DevOps Assignment

## Getting Started

Navigate into the directory:

```bash
cd todo-devops-assignment
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

## CI/CD Deployment Process

- **CI Workflow (`ci.yml`)** — runs automated tests and lint checks on every push.
- **Deploy Workflow (`deploy.yml`)** — builds the project and deploys it to Vercel automatically when changes are merged into `main`.
- **Secrets** (like `VERCEL_API_TOKEN`) are securely stored in GitHub Actions.

## Challenges & Resolutions

Resolved by enforcing branch protection and pull request reviews. 

Fixed by aligning Node.js versions and clearing Vercel build cache. 

Configured securely in Vercel and GitHub Secrets. 

## Build Status

![CI](https://github.com/hitharadissanayake23-cmyk/todo-devops-assignment/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/hitharadissanayake23-cmyk/todo-devops-assignment/actions/workflows/deploy.yml/badge.svg)
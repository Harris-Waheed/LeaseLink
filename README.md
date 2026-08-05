<div align="center">
  
  # LeaseLink
  
  **A Modern, Comprehensive Property & Lease Management System**

  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

  [Explore The Features](#features) • [Installation](#installation) • [API Documentation](#api-documentation) • [Contributing](#contributing)

</div>

---

## Overview

**LeaseLink** is a full-stack, enterprise-grade Property Management solution designed to bridge the gap between property administrators and tenants. Built with a high-performance **FastAPI** backend and a dynamic, beautifully crafted **React (Vite) + Tailwind CSS** frontend, LeaseLink simplifies the complex workflows of real estate management.

Whether it is managing multiple properties, automating lease agreements, tracking payments, or handling maintenance requests, LeaseLink provides a seamless, intuitive, and responsive experience with distinct portals for **Admins** and **Tenants**.

<br/>

## Features

### Administrator Portal
* **Dashboard Analytics:** Comprehensive overview of revenue, active leases, and pending maintenance visualized with interactive charts.
* **Property Management:** Add, edit, and categorize properties and individual units.
* **Tenant & Lease Tracking:** End-to-end lease creation, tenant onboarding, and historical tracking.
* **Financial Operations:** Monitor rent collections, view transaction histories, and manage invoices.
* **Maintenance Operations:** Review, assign, and track maintenance tickets submitted by tenants.

### Tenant Portal
* **Secure Login:** A dedicated, secure environment for residents to manage their tenancy.
* **Rent Payments:** Streamlined and secure rent payment workflows.
* **Maintenance Requests:** Easily submit, update, and track the status of maintenance or repair tickets.
* **Document Access:** Instant access to current lease agreements and important property documents.

<br/>

## Application Gallery

### Administrator Portal
<div align="center">
  <img src="docs/assets/Screenshot (1770).png" alt="Admin Login" width="48%" />
  <img src="docs/assets/Screenshot (1771).png" alt="Admin Dashboard" width="48%" />
  <br/>
  <img src="docs/assets/Screenshot (1772).png" alt="Admin Properties" width="48%" />
  <img src="docs/assets/Screenshot (1773).png" alt="Admin Tenants" width="48%" />
  <br/>
  <img src="docs/assets/Screenshot (1774).png" alt="Admin Leases" width="48%" />
  <img src="docs/assets/Screenshot (1775).png" alt="Admin Payments" width="48%" />
  <img src="docs/assets/Screenshot (1776).png" alt="Admin Maintenance" width="48%" />
  <img src="docs/assets/Screenshot (1777).png" alt="Admin Profile" width="48%" />
</div>

<br/>

### Tenant Portal
<div align="center">
  <img src="docs/assets/Screenshot (1778).png" alt="Tenant Login" width="48%" />
  <img src="docs/assets/Screenshot (1779).png" alt="Tenant Dashboard" width="48%" />
  <br/>
  <img src="docs/assets/Screenshot (1780).png" alt="Tenant Payments" width="48%" />
  <img src="docs/assets/Screenshot (1781).png" alt="Tenant Maintenance" width="48%" />
  <br/>
  <img src="docs/assets/Screenshot (1782).png" alt="Tenant Profile" width="48%" />
</div>

<br/>

## Technology Stack

### Frontend Architecture
* **Core:** React 19, Vite
* **Styling:** Tailwind CSS v4, Framer Motion (for micro-animations)
* **State & Data Fetching:** React Query (TanStack), Axios
* **Form Handling:** React Hook Form, Zod (Schema Validation)
* **UI Components:** Recharts (Data visualization), Lucide React (Icons), React Hot Toast (Notifications)

### Backend Architecture
* **Core Framework:** FastAPI (Python)
* **Database:** PostgreSQL (with Asyncpg Connection Pooling)
* **Authentication:** JWT-based Security & Role-Based Access Control (RBAC)
* **External Services:** Cloudinary (Image Hosting), FastAPI-Mail (Email Notifications)

<br/>

## Installation & Local Setup

Follow these steps to run LeaseLink locally.

### Prerequisites
- Node.js (v18 or higher)
- Python (3.10 or higher)
- PostgreSQL (Local or Dockerized)
- Cloudinary Account (for image uploads)

<details>
<summary><b>1. Backend Setup (FastAPI)</b></summary>
<br/>

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Create a `.env` file in the `Backend` directory and add your credentials:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/leaselink
   SECRET_KEY=your_super_secret_jwt_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
5. Run the development server:
   ```bash
   uvicorn main:app --host localhost --port 8000 --reload
   ```

</details>

<details>
<summary><b>2. Frontend Setup (React/Vite)</b></summary>
<br/>

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the `Frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

</details>

<br/>

## Project Structure

```text
📁 LeaseLink/
├── 📁 Backend/                 
│   ├── 📁 Admin_Routers/       # API endpoints specific to Administrators
│   ├── 📁 DataBase/            # Database configurations and connection setup
│   ├── 📁 Tenant_Routers/      # API endpoints accessible by Tenants
│   ├── 📁 models/              # Database schema definitions and Pydantic models
│   ├── 📄 cloudinary_id.py     # Image upload and hosting utilities
│   ├── 📄 database.py          # Database connection pooling and session management
│   ├── 📄 mail.py              # Automated email notification system
│   ├── 📄 main.py              # Application entry point and router integration
│   └── 📄 security.py          # JWT generation, hashing, and validation
│
└── 📁 Frontend/                
    ├── 📁 public/              # Static public assets
    ├── 📁 src/
    │   ├── 📁 assets/          # Static files and images
    │   ├── 📁 components/      # Reusable UI elements (Buttons, Modals, Cards)
    │   ├── 📁 context/         # React Context providers (Auth, Theme, etc.)
    │   ├── 📁 hooks/           # Custom React hooks (React Query integrations)
    │   ├── 📁 layouts/         # Page layout wrappers (AdminLayout, TenantLayout)
    │   ├── 📁 pages/           # High-level route components
    │   ├── 📁 services/        # API call definitions (Axios instances)
    │   ├── 📁 utils/           # Helper functions and utilities
    │   ├── 📄 App.jsx          # Main application component and routing logic
    │   └── 📄 main.jsx         # React application entry point
    ├── 📄 package.json         # NPM dependencies and scripts
    └── 📄 vite.config.js       # Vite configuration
```

<br/>

## API Documentation

Once the backend server is running, FastAPI automatically generates interactive API documentation. You can access it by navigating to:

* **Swagger UI:** `http://localhost:8000/docs`
* **ReDoc:** `http://localhost:8000/redoc`

<br/>

## Design Philosophy

LeaseLink was built with a strong emphasis on User Experience (UX) and Developer Experience (DX):
* **Type Safety:** Enforced end-to-end using Pydantic on the backend and Zod on the frontend.
* **Optimistic Updates:** React Query ensures that the UI feels incredibly fast and responsive, even on slower networks.
* **Modern Aesthetics:** Tailored styling with Tailwind CSS, utilizing glassmorphism and smooth Framer Motion transitions for a premium feel.

<br/>

## Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br/>

## License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">Built with dedication by a passionate developer.</div>

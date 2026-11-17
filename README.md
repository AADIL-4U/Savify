# Savify — Personal Finance and Expense Tracking System

**Your Money, In Focus.** Savify is a full-stack personal finance and expense tracking web application engineered with the **MERN Stack** (MongoDB, Express.js, React, Node.js). Savify centralizes income and expense logging, custom categorization, monthly budget tracking, multi-currency conversion, and real-time financial analytics behind a secure authentication layer.

---

## Live Deployment

* **Web Application (Frontend):** [https://savify-kappa.vercel.app](https://savify-kappa.vercel.app)
* **REST API (Backend):** `https://savify-backend-w29p.onrender.com/api`

> **Note:** The backend runs on Render's free tier and spins down after 15 minutes of inactivity. The first request after an idle period may take 30–50 seconds to wake the server, after which responses are instantaneous.

---

## Academic Project Details

| Field | Details |
| :--- | :--- |
| **Project Title** | Savify: A Personal Finance and Expense Tracking System |
| **Course** | Software Engineering and System Design (`24CS301PC311`) |
| **Program** | III Year, I Semester B.Tech – Computer Science & Engineering |
| **Submitted By** | Mohd Aadil Ashraf (`2403A51315`) |
| **Supervised By** | Dr. Asha S., Assistant Professor |
| **Institution** | Department of Computer Science & Artificial Intelligence, SR University, Warangal |
| **Academic Year** | 2026–2027 |

---

## Key Features

### 1. Authentication & Account Security
- **User Registration & Validation:** Enforces strict calendar date-of-birth checks, country validation, and preferred currency selection (`INR`, `USD`, `EUR`, `GBP`).
- **Email Verification:** Generates cryptographically secure verification tokens (stored as SHA-256 hashes with a 24-hour expiration) and restricts login until verified.
- **Stateless Session Management:** Issues signed JSON Web Tokens (JWT) valid for 30 days upon authentication.
- **Dual Account Recovery:** Supports password resets via either user-configured security questions or a rate-limited 6-digit email OTP (10-minute expiry, maximum 5 atomic attempts).
- **Atomic Account Deletion:** Uses multi-document MongoDB sessions and transactions to cascade-delete all user transactions, categories, and profile records atomically upon OTP confirmation.

### 2. Transaction & Category Management
- **Full Transaction CRUD:** Create, edit, filter, and delete `income` and `expense` transactions with date-range presets (*This Month*, *Last Month*, *Last 3 Months*, *This Year*, *Previous Year*, *All Time*, and *Custom Range*).
- **Integer Subunit Precision:** Stores all monetary amounts as integers in the smallest currency subunit (paise/cents) to prevent floating-point arithmetic errors.
- **Custom Categories & Safe Deletion:** Create color-tagged categories; deleting a custom category automatically reassigns its historical transactions to an `Uncategorized` fallback bucket so no financial data is orphaned.
- **CSV Export:** Export filtered transaction histories directly to a `.csv` file from the browser.

### 3. Budgeting, Analytics & UI
- **Monthly Category Budgets:** Configure monthly-specific spending limits (`YYYY-MM`) with visual progress bars and threshold tracking.
- **Interactive Dashboard:** Aggregates all-time current balance, period income, period expenses, net savings, and category-wise expense breakdowns via MongoDB aggregation pipelines.
- **Multi-Currency & Theme Support:** Supports dynamic currency conversion (`INR`, `USD`, `EUR`, `GBP`) and seamless toggling between **Light Mode** and **OLED Dark Mode**.

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios, Chart.js / Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ODM
- **Security & Utilities:** `bcryptjs`, `jsonwebtoken` (JWT), Node `crypto` (SHA-256), Express Rate Limiter, SMTP/Brevo Email Service

---

## Project Architecture & Directory Structure

```text
Savify/
├── backend/
│   ├── config/
│   │   └── db.js                      # MongoDB connection setup
│   ├── controllers/
│   │   ├── authController.js          # Registration, login, verification, OTP recovery, deletion
│   │   ├── categoryController.js      # Custom categories, monthly budgets, reassignment
│   │   ├── currencyController.js      # Exchange rate endpoints
│   │   └── transactionController.js   # Transaction CRUD & dashboard aggregation pipelines
│   ├── middleware/
│   │   ├── authMiddleware.js          # JWT verification & route protection
│   │   └── rateLimiter.js             # Brute-force & OTP request rate limiting
│   ├── models/
│   │   ├── Category.js                # Category & monthlyBudgets Mongoose schema
│   │   ├── Transaction.js             # Transaction Mongoose schema (paise integer storage)
│   │   └── User.js                    # User credentials, preferences & OTP fields
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── currencyRoutes.js
│   │   └── transactionRoutes.js
│   ├── services/
│   │   ├── emailService.js            # Transactional verification & OTP emails
│   │   └── exchangeRateService.js     # Multi-currency conversion rates
│   ├── .env.example                   # Environment variable template
│   ├── package.json
│   └── server.js                      # Express application entry point
│
└── frontend/
    ├── src/
    │   ├── components/                # AuthLayout, ConfirmModal, ForgotPasswordModal, Layout, Navbar, ProtectedRoute, Sidebar, TransactionModal
    │   ├── context/                   # AuthContext & ThemeContext (Light / OLED Dark)
    │   ├── pages/                     # Categories, CheckEmail, Dashboard, Login, Register, Settings, Transactions, VerifyEmail
    │   ├── services/
    │   │   └── api.js                 # Centralized Axios HTTP client
    │   ├── utils/
    │   │   └── currency.js            # Currency formatting helpers
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Local Setup & Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas cluster)

### 1. Clone the Repository
```bash
git clone [https://github.com/AADIL-4U/Savify.git](https://github.com/AADIL-4U/Savify.git)
cd Savify
```

### 2. Configure & Start the Backend
```bash
cd backend
npm install
```
Create a `backend/.env` file with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173

# Email Configuration ("console", "brevo", or "smtp")
EMAIL_MODE=brevo
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=Savify <your-verified-sender@example.com>
```

Start the backend server:
```bash
npm start
```

### 3. Configure & Run the Frontend
Open a second terminal from the root `Savify` directory:
```bash
cd frontend
npm install
```

Create a `frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the Vite development server:
```bash
npm run dev
```
Open the local URL displayed by Vite (typically `http://localhost:5173`) in your browser.
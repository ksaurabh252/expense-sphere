# Expense Sphere — Backend API

A real-time expense splitting backend inspired by Splitwise. Built with Node.js, Express, MongoDB, Redis, and Socket.IO.

---

## 🛠 Tech Stack

| Technology         | Purpose             |
| ------------------ | ------------------- |
| Node.js + Express  | REST API Server     |
| MongoDB + Mongoose | Database & ODM      |
| Redis              | Response Caching    |
| Socket.IO          | Real-time Events    |
| JWT                | Authentication      |
| Argon2             | Password Hashing    |
| Resend             | Email Notifications |

---

## ✨ Features

- User Registration & Login (JWT)
- Profile Management
- Group Creation & Member Management
- Expense Tracking (Equal, Unequal, Percentage splits)
- Real-time Balance Calculation
- Settlement & Payment Tracking
- In-app Notifications + Email Reports
- Redis Caching for Group Data
- Socket.IO Real-time Updates

---

## 📁 Project Structure

```
server/
├── config/
│   ├── db.js
│   ├── redis.js
│   └── email.js
├── models/
│   ├── user.model.js
│   ├── group.model.js
│   ├── expense.model.js
│   ├── settlement.model.js
│   └── notification.model.js
├── controllers/
│   ├── userController.js
│   ├── groupController.js
│   ├── expenseController.js
│   ├── settlementController.js
│   └── reportController.js
├── routes/
│   ├── auth.route.js
│   ├── user.route.js
│   ├── group.route.js
│   └── expense.route.js
├── middleware/
│   └── authMiddleware.js
├── server.js
└── .env
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (running locally or Atlas)
- Redis (via Docker or local)

### Installation

```bash
git clone <repo-url>
cd server
npm install
```

### Environment Variables (`.env`)

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/expense-sphere
JWT_SECRET=your_super_secret_key
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=re_your_resend_key
```

### Run Server

```bash
npm start
```

Server runs at `http://localhost:3001`

---

## 📡 API Endpoints

### Auth

| Method | Endpoint         | Auth | Description       |
| ------ | ---------------- | ---- | ----------------- |
| POST   | `/user/register` | No   | Register new user |
| POST   | `/user/login`    | No   | Login & get JWT   |

### User

| Method | Endpoint                    | Auth | Description              |
| ------ | --------------------------- | ---- | ------------------------ |
| GET    | `/user/profile`             | Yes  | Get user profile         |
| PUT    | `/user/profile`             | Yes  | Update profile           |
| GET    | `/user/groups`              | Yes  | Get user groups (cached) |
| POST   | `/user/send-monthly-report` | Yes  | Email spending report    |

### Group

| Method | Endpoint                 | Auth | Description  |
| ------ | ------------------------ | ---- | ------------ |
| POST   | `/user/create`           | Yes  | Create group |
| POST   | `/user/:groupId/members` | Yes  | Add member   |

### Expense

| Method | Endpoint                     | Auth | Description        |
| ------ | ---------------------------- | ---- | ------------------ |
| POST   | `/user/expenses`             | Yes  | Add expense        |
| GET    | `/user/:groupId/expenses`    | Yes  | Get group expenses |
| GET    | `/user/:groupId/balances`    | Yes  | Get balances       |
| GET    | `/user/:groupId/settlements` | Yes  | Get settlements    |
| POST   | `/user/settlements`          | Yes  | Mark as settled    |

---

## 🔌 Socket.IO Events

| Event              | Direction       | Description           |
| ------------------ | --------------- | --------------------- |
| `join-group`       | Client → Server | Join group room       |
| `expense-added`    | Server → Client | New expense created   |
| `balance-updated`  | Server → Client | Balances recalculated |
| `notification-new` | Server → Client | New notification      |

---



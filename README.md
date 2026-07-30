# 💰 Finance Tracker

A full-stack personal finance tracker where users can register, log in, and manage their income & expense transactions with a live dashboard summary.

## 🌐 Live Demo

- **Frontend:** [https://finance-tracker-lac-sigma.vercel.app](https://finance-tracker-lac-sigma.vercel.app)
- **Backend API:** [https://finance-tracker-production-a359.up.railway.app](https://finance-tracker-production-a359.up.railway.app)

## ✨ Features

- User **register / login / logout**
- **JWT authentication** (protected routes)
- Add / edit / delete **transactions** (income & expense)
- **Dashboard** with balance, total income & total expense
- Category-based tracking
- Persistent storage with **MongoDB**

## 🛠️ Tech Stack

**Frontend:** React, Vite, Context API, Axios, CSS
**Backend:** Node.js, Express.js, Mongoose (MongoDB), JWT, bcrypt
**Database:** MongoDB Atlas
**Deployment:** Vercel (frontend) · Railway (backend)

## 📁 Project Structure

```txt
FINANCE-TRACKER/
├── backend/
│   └── src/
│       ├── controllers/
│       ├── db/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── utils/
│       ├── app.js
│       ├── constants.js
│       └── index.js
├── frontend/
│   └── vite-project/
│       └── src/
│           ├── components/
│           ├── context/
│           ├── hooks/
│           ├── pages/
│           ├── services/
│           └── utils/
└── README.md
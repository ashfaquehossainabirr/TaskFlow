# TaskFlow — Project & Task Management System

A full-stack task/project tracker built with **React (Vite)**, **Express**, and **MongoDB**.

- Role-based auth (Admin / Employee) with JWT
- Admin dashboard: create users, create & assign tasks, edit/delete anything
- Employee dashboard: see assigned tasks, update task status
- Task statuses: `todo`, `in-progress`, `delivered`, `cancelled`, `hold`
- Every task shows **days remaining** until its deadline
- **Deadline Watch**: a dedicated view (and overview widget) listing every open task
  with **3 days or fewer** remaining

---

## 1. Prerequisites

- Node.js 18+
- A MongoDB database — either:
  - Local MongoDB (`mongod` running on `mongodb://127.0.0.1:27017`), or
  - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (get a connection string)

## 2. Backend setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — replace with a long random string
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — credentials for the first admin account

Install and run:

```bash
npm install
npm run seed   # creates the first admin account from your .env values
npm run dev    # starts the API on http://localhost:5000 (nodemon, auto-restarts)
# or: npm start
```

Health check: `GET http://localhost:5000/api/health`

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev    # starts the app on http://localhost:5173
```

`VITE_API_URL` in `frontend/.env` should point at your backend (default `http://localhost:5000/api`).

## 4. Log in

Open `http://localhost:5173`, and log in with the admin account created by `npm run seed`
(defaults: `admin@taskflow.com` / `Admin@12345` unless you changed `.env`).

From the **Team & Access** page, the admin can create employee accounts. Employees log in
with those credentials and only see the tasks assigned to them.

---

## How it's organized

```
backend/
  models/User.js        # admin/employee accounts, hashed passwords
  models/Task.js         # tasks with status, deadline, assignment, history
  routes/auth.js          # POST /login, GET /me
  routes/users.js         # admin-only user CRUD
  routes/tasks.js         # task CRUD, stats, upcoming-deadlines
  middleware/auth.js      # JWT verification + role guard
  seed.js                 # creates the first admin account

frontend/
  src/pages/Login.jsx
  src/pages/Overview.jsx        # dashboard: stats + top urgent tasks
  src/pages/Tasks.jsx           # full task list, create/edit/assign (admin), status update (all)
  src/pages/DeadlineWatch.jsx   # tasks due in <= 3 days
  src/pages/Users.jsx           # admin-only user management
  src/context/AuthContext.jsx   # login state, token storage
  src/components/               # shared UI: task table, forms, badges, deadline chips
```

## Permissions summary

| Action                          | Admin | Employee |
|----------------------------------|:-----:|:--------:|
| Log in                           | ✅    | ✅       |
| View own assigned tasks          | ✅    | ✅       |
| View all tasks                   | ✅    | ❌       |
| Create / assign tasks            | ✅    | ❌       |
| Edit task details / reassign     | ✅    | ❌       |
| Update status of own tasks       | ✅    | ✅       |
| Delete tasks                     | ✅    | ❌       |
| Create / edit / delete users     | ✅    | ❌       |

## Notes

- Passwords are hashed with bcrypt; never stored in plain text.
- JWTs are stored in `localStorage` on the client and sent as a `Bearer` token.
- Deleting a user who still has tasks assigned is blocked — reassign or delete their tasks first.
- Deployed separately? Set `CLIENT_URL` in the backend `.env` to your deployed frontend origin
  (comma-separate multiple origins) so CORS allows it.

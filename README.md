# 🚀 DevTing-B — Developer Social Platform Backend

Welcome to **DevTing-B**, the robust backend system behind a modern, real-time social platform for developers.  
Crafted using **Node.js**, **Express**, **MongoDB**, and **Socket.io**, this backend delivers secure authentication, live messaging, intelligent suggestions, and seamless developer connections — all optimized for performance and scalability.

> 🔒 Secure · ⚡ Real-Time · 🔍 Searchable · 👥 Connection-Centric

---

## ✨ Features

- 🔐 **Authentication** – JWT-based signup, login, and logout
- 👤 **Profile Management** – View and update profile, reset passwords
- 🤝 **Connection System** – Send, receive, and review connection requests
- 💬 **Real-Time Chat** – Instant messaging with seen status and presence detection
- 🔎 **Developer Search** – Search users by name or skills
- 🧭 **Feed Recommendations** – Discover developers you’re not yet connected with
- 🧱 **Modular Architecture** – Scalable code structure with MongoDB
- 🛡️ **Security** – Encrypted credentials and tokenized sessions

---

## 🧰 Tech Stack

| Technology        | Role                              |
|-------------------|-----------------------------------|
| **Node.js**       | JavaScript runtime                |
| **Express.js**    | RESTful API framework             |
| **MongoDB**       | NoSQL database                    |
| **Mongoose**      | MongoDB ODM                       |
| **Socket.io**     | Real-time communication           |
| **JWT**           | User authentication               |
| **bcrypt**        | Password encryption               |
| **dotenv**        | Environment variable handling     |
| **cookie-parser** | Cookie management                 |
| **CORS**          | Cross-origin resource sharing     |

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/dhirajharane/devting-b.git
cd devting-b
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a `.env` File

```env
DB_CONNECTION_SECRET=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 4. Run the Development Server

```bash
npm start
```

Access the server at: `http://localhost:3000`

---

## 🔗 API Endpoints

### 🔐 Authentication

| Method | Endpoint     | Description          |
|--------|--------------|----------------------|
| POST   | `/signup`    | Register a new user  |
| POST   | `/login`     | Authenticate a user  |
| POST   | `/logout`    | End user session     |

### 👤 Profile Management

| Method | Endpoint                  | Description             |
|--------|---------------------------|-------------------------|
| GET    | `/profile/view`           | Get user profile        |
| PUT    | `/profile/edit`           | Update user details     |
| POST   | `/profile/forgotPassword` | Trigger password reset  |

### 🤝 Connection Handling

| Method | Endpoint                              | Description                  |
|--------|----------------------------------------|------------------------------|
| POST   | `/request/send/:status/:toUserId`      | Send a connection request    |
| POST   | `/request/review/:status/:requestId`   | Accept / Reject / Ignore     |

### 👥 User Data

| Method | Endpoint                  | Description                |
|--------|---------------------------|----------------------------|
| GET    | `/user/requests/received` | View received requests     |
| GET    | `/user/connections`       | View current connections   |
| GET    | `/feed`                   | Suggested users to follow  |

### 🔍 Search Developers

| Method | Endpoint         | Description                   |
|--------|------------------|-------------------------------|
| GET    | `/search?q=term` | Search users by name or skill |

---

## 💬 Real-Time Chat (Socket.io)

| Socket Event   | Description                      |
|----------------|----------------------------------|
| `userOnline`   | Emit when a user comes online    |
| `sendMessage`  | Send chat messages               |
| `messageSeen`  | Notify when message is read      |
| `/chat/:id`    | Start or continue a conversation |

---

## 🌐 Deployment Notes

- Deploy using platforms like **Render**, **Railway**, or **Heroku**
- Configure `.env` variables in your hosting dashboard
- Enable WebSocket support for Socket.io
- Update CORS settings to match frontend origin

---

## 🔐 Security Best Practices

- Never commit `.env` or sensitive credentials to source control
- Always use **HTTPS** in production environments
- Validate and sanitize all incoming user data
- Keep dependencies up to date

---

## 📄 License

This project is licensed under the **MIT License**.  
Feel free to use, modify, and build on top of it.

---

## 👨‍💻 Author

**Dhiraj**  
Building real-time digital ecosystems with scalable backends.  
[GitHub](https://github.com/dhirajharane) 

---

> 💡 *Powering real-time, secure, and smart developer connections — with DevTing-B.*
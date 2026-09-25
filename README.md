# Khelzam Server ⚙️

The robust backend REST API for the Khelzam educational platform. This server manages complex business logic for exam creation, handles secure user authentication, and serves data to the frontend dashboard. 

## 🏗️ System Architecture & Tech Stack

* **Runtime Environment:** [Node.js](https://nodejs.org/) (v18+)
* **Web Framework:** [Express.js](https://expressjs.com/)
* **Database:** [MongoDB](https://www.mongodb.com/) utilizing [Mongoose](https://mongoosejs.com/) ODM
* **Security & Auth:** JSON Web Tokens (JWT), bcryptjs for password hashing, CORS, and Express Rate Limit
* **Environment Management:** dotenv

## 📁 Project Structure

```text
khelzam-server/
├── config/           # Database connections and environment configurations
├── controllers/      # Route logic and request handling (Exams, Users, Auth)
├── middlewares/      # Custom middlewares (Auth verification, Error handling)
├── models/           # Mongoose schemas (User, Exam, Result)
├── routes/           # Express route definitions
├── utils/            # Helper functions (Token generation, validation)
├── .env.example      # Template for environment variables
├── server.js         # Application entry point
└── package.json      # Dependencies and scripts


## 📡 API Endpoints Reference

The API follows RESTful principles and returns data in standard JSON format. 

### Authentication & Users

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new system user | No | Any |
| **POST** | `/api/auth/login` | Authenticate and retrieve JWT | No | Any |
| **GET** | `/api/users/profile` | Get logged-in user's profile | Yes | Any |
| **PUT** | `/api/users/profile` | Update user profile details | Yes | Any |

### Exam Management

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/exams` | Create a new exam with questions | Yes | Admin/Teacher |
| **GET** | `/api/exams` | Retrieve a paginated list of all exams | Yes | Any |
| **GET** | `/api/exams/:id` | Get full details of a specific exam | Yes | Any |
| **PUT** | `/api/exams/:id` | Update an existing exam's details | Yes | Admin/Teacher |
| **DELETE**| `/api/exams/:id` | Delete an exam from the database | Yes | Admin/Teacher |

### Assessment & Results

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/results/:examId` | Submit exam answers for grading | Yes | Student |
| **GET** | `/api/results/:examId` | Get all student scores for an exam | Yes | Admin/Teacher |
| **GET** | `/api/results/user/:userId`| Retrieve exam history for a user | Yes | Any |

## 📦 Local Setup & Installation

### Prerequisites

* **Node.js:** Ensure you have Node v18 or higher installed.
* **MongoDB:** A running local MongoDB instance or an active MongoDB Atlas cluster.

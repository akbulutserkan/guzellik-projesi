# Appointment System

This is a modern appointment management system built with Next.js, Prisma, and PostgreSQL. It allows businesses to manage appointments, services, staff, customers, and packages.

## Features

- 📅 Complete appointment scheduling and management
- 👥 Customer management
- 👨‍💼 Staff management with role-based permissions
- 🛠️ Service and category management
- 📦 Package and session tracking
- 💰 Payment processing and tracking
- 📊 Reports and analytics
- 🔐 Secure authentication and authorization

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/akbulutserkan/appointment-system.git
cd appointment-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```
Then edit the `.env` file with your database connection string and other settings.

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Seed the database (optional):
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses a relational database with the following main entities:
- Staff (with roles and permissions)
- Customers
- Services and Service Categories
- Appointments
- Packages and Package Sessions
- Payments
- Products and Product Sales

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

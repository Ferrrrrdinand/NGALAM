# AGENTS.md — Ngalam Fix Pro

Guidelines and operational rules for AI agents working in this repository.

---

## 1. Project Overview & Architecture

Full-stack application for phone repair services, warranty tracking, and partner/affiliate commission system:
- **Root / Backend (`server.js`)**: Express.js server mounting routes under `/api/...` and serving static admin/client assets.
- **Client (`client/`)**: React + Vite + Tailwind CSS frontend interface.
- **Database**: Sequelize ORM connecting to MySQL/PostgreSQL with fallback mock sync scripts in `src/scripts/syncAll.js`.
- **Local / Mock Data**: Fallback JSON stores in `data/` (`customers.json`, `orders.json`, `warranties.json`, `finances.json`, `commissions.json`, dll.).

---

## 2. Key Commands

```bash
npm run dev:server       # Run backend (node server.js)
npm run dev:client       # Run React client dev server
npm run build:client     # Build frontend into client/dist
npm test                 # Run test suites in test/ folder
```

---

## 3. Important Implementation Notes

- **Route Structure**: Handlers are organized modularly in `routes/` (`authRoutes.js`, `orderRoutes.js`, `warrantyRoutes.js`, `mitraRoutes.js`, `financeRoutes.js`, `customerRoutes.js`, `exportRoutes.js`).
- **Tests**: When adding or updating APIs, verify with test scripts in `test/` (e.g., `node test/test_comprehensive_logins.js`, `node test/test_transaction_warranty_claim.js`).
- **Deployment**: Production deployment files for cPanel must follow rules in `CPANEL_DEPLOY_GUIDE.md`. Keep sensitive keys inside `.env`.


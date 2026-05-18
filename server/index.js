const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize DB first (seeds admin)
const db = require('./db');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');
const purchasesRoutes = require('./routes/purchases');
const adminsRoutes = require('./routes/admins');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/purchases', purchasesRoutes);
// Products sub-routes on events (POST /api/events/:id/products)
app.use('/api', productsRoutes);

// Serve static client in production
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).json({ error: err.message || 'שגיאה פנימית בשרת' });
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT]', err.message, err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});

app.listen(PORT, () => {
  console.log(`המחלבה server running on http://localhost:${PORT}`);
});

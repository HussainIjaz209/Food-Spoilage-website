const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request logging
app.use(morgan('dev'));

// Static uploads directory serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Bind routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/donations', require('./routes/donation.routes'));
app.use('/api/claims', require('./routes/claim.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Health check API
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Community Food Wastage Reduction Portal Backend is running.' });
});

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'API Endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: err.stack ? { message: err.message } : {}
  });
});

app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
});

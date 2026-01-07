const app = require('./app');

// Chỉ start server khi chạy locally (không phải trên Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Food API server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;

import { app } from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 3003;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });

export default app;

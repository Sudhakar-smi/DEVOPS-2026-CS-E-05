import mongoose from 'mongoose';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      try {
        console.log(`[DB] Attempting connection to MongoDB URI: ${mongoUri.replace(/:([^:@]{1,})@/, ':****@')}`);
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 4000
        });
        console.log(`[DB] Successfully connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      } catch (err) {
        console.warn(`[DB] Failed to connect to configured MONGODB_URI: ${err.message}`);
        console.log('[DB] Falling back to embedded MongoDB Memory Server...');
      }
    }

    // Fallback to MongoMemoryServer for instant zero-config out-of-the-box local usage
    console.log('[DB] Initializing Embedded MongoDB Server...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();

    const conn = await mongoose.connect(uri, {
      dbName: 'ai_event_planner'
    });
    console.log(`[DB] Connected to Embedded In-Memory MongoDB Server at: ${uri}`);
    return conn;
  } catch (error) {
    console.error(`[DB] Fatal Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (error) {
    console.error(`[DB] Error closing database connection: ${error.message}`);
  }
};

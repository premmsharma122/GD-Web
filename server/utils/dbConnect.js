const mongoose = require('mongoose');

// Cache the connection in the global object for Vercel function reuse
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in environment variables');
    }

    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = dbConnect;
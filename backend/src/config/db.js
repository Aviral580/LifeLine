
import mongoose from 'mongoose';



const connectDB = async () => {

  try {

    const conn = await mongoose.connect(process.env.MONGO_URI, {

      // These options ensure stable connections in production

      serverSelectionTimeoutMS: 5000,

      socketTimeoutMS: 45000,

    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    console.log(`   Database Name: ${conn.connection.name}`);

  } catch (error) {

    console.error(`❌ Error: ${error.message}`);

    // Exit process with failure so Docker/PM2 knows to restart

    process.exit(1);

  }

};



export default connectDB;


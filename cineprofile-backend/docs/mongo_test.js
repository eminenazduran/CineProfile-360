import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function testMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB bağlantısı başarılı:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ Bağlantı hatası:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

testMongo();
# MongoDB Atlas Bağlantı Notları (Backend)

## 1) .env ayarları
```env
MONGO_URI=mongodb+srv://cineprofile_user:<Gkrtl11.>@cluster0.yp3g7mb.mongodb.net/cineprofile?retryWrites=true&w=majority&appName=Cluster0

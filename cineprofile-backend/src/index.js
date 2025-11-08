// src/index.js
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
});

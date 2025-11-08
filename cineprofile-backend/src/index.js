const app = require('./app');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ CineProfile360 backend running on port ${port}`);
});

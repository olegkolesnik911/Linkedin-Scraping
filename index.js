const express = require('express');
const mongoose = require('mongoose');
const creditRouter = require('./routers/creditRouter');

const app = express();
const dbUri = "mongodb+srv://admin:OuYn0rAeFVp7FRvA@cluster0.vaojycr.mongodb.net/LinkedinScrap?retryWrites=true&w=majority";
const port = 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Routes
app.use('/credits', creditRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
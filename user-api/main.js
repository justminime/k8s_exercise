const express = require('express');
const mongoose = require('mongoose');

const app = express();

mongoose.connect('mongodb://mongodb/users', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String
});

const User = mongoose.model('User', UserSchema);

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.listen(3000, () => {
  console.log('API listening on port 3000');
});

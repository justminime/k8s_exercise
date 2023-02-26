const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Connect to MongoDB database
mongoose.connect('mongodb://mongodb/shifts', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define Shift schema
const shiftSchema = new mongoose.Schema({
  startTime: Date,
  endTime: Date,
  employeeId: String
});

const Shift = mongoose.model('Shift', shiftSchema);

// Define API endpoints
app.get('/shifts', async (req, res) => {
  // Retrieve all shifts from database
  const shifts = await Shift.find();

  // Return shifts as JSON response
  res.json(shifts);
});

app.get('/shifts/:id', async (req, res) => {
  const shiftId = req.params.id;

  // Retrieve shift with the specified ID from database
  const shift = await Shift.findById(shiftId);

  // Return shift as JSON response
  res.json(shift);
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
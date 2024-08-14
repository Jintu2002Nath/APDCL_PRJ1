const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and urlencoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to serve static files
app.use('/resource', express.static(path.join(__dirname, 'resource')));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/apdcl', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Schema and model
const EmployeeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true }
});

const Employee = mongoose.model('Employee', EmployeeSchema);

// Route to serve sign-up page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'sign-up.html'));
});

// Route to handle registration
app.post('/register', async (req, res) => {
  const { employeeEmail, role } = req.body;

  try {
    const newEmployee = new Employee({ email: employeeEmail, role });
    await newEmployee.save();
    res.status(201).send('Employee registered successfully');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

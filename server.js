const express = require('express');
const multer = require('multer');
const { MongoClient, GridFSBucket } = require('mongodb');
const Grid = require('gridfs-stream');
const path = require('path');
const fs = require('fs');

const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Middleware for parsing multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to parse JSON and urlencoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB URI
const mongoURI = 'mongodb://127.0.0.1:27017';
const dbName = 'fileuploads';

let gfs, bucket;

// Connect to MongoDB
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        const db = client.db(dbName);
        bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        gfs = Grid(db, MongoClient);
        gfs.collection('uploads');
        console.log('Connected to MongoDB');
    })
    .catch(err => console.error(err));





    // Schema and model
const EmployeeSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true }
  });
  
  const Employee = mongoose.model('Employee', EmployeeSchema);

  //register routes


  // Routes
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
  
//signup

// Middleware to serve static files
app.use('/resource', express.static(path.join(__dirname, 'resource')));


app.get('/signup', (req,res)=>{

    res.sendFile(path.join(__dirname, 'sign-up.html'));



})



// Serve the upload form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    const { file } = req;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const writeStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
    });

    writeStream.end(file.buffer);

    writeStream.on('finish', () => {
        res.status(201).send('File uploaded successfully.');
    });

    writeStream.on('error', err => {
        console.error(err);
        res.status(500).send('Error uploading file.');
    });
});



// Fetch all files metadata
app.get('/files', async (req, res) => {
    try {
        const files = await gfs.files.find().toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({
                message: 'No files available'
            });
        }
        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch a single file by filename
app.get('/file/:filename', async (req, res) => {
    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const readStream = bucket.openDownloadStreamByName(req.params.filename);
        readStream.pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// Serve the dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard2.html'));
});





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

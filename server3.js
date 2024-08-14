const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const Grid = require('gridfs-stream');
const path = require('path');
const bodyParser = require('body-parser');
const { type } = require('express/lib/response');

const app = express();
const port = 3000;

// Middleware for parsing multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to parse JSON and urlencoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB URI
const mongoURI = 'mongodb://127.0.0.1:27017/fileuploads';

// Mongoose connection
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB with Mongoose'))
    .catch(err => console.error(err));

let gfs, bucket;

const conn = mongoose.connection;
conn.once('open', () => {
    bucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log('GridFS stream initialized');
});

// Schema and model
const EmployeeSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true }
});

const Employee = mongoose.model('Employee', EmployeeSchema);


//employee password collection schema

const EmployeePasswordSchema=new mongoose.Schema({

    role:{type:String},
    password:{type:String}

});


const PasswordSchema=mongoose.model('PasswordSchema',EmployeePasswordSchema )




// Register route
app.post('/register', async (req, res) => {
    const { employeeEmail, role } = req.body;

    try {
        const newEmployee = new Employee({ email: employeeEmail, role });
        await newEmployee.save();
        res.status(201).send(`
            
              <div style="display: flex; flex-direction:column; justify-content: center; align-items: center; height: 100vh;">
                <h1 style="color: lightblue; text-align: center;">Registration Successful.</h1>
                <h2 style="color: lightblue; text-align: center;" >Redirecting to Login Page Within 2sec...</h2>
            </div>
            

                   <script>
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    </script>
            
            
            `);
    } catch (err) {
        res.status(400).send(err.message);
    }
});



// Middleware to serve static files
app.use('/resource', express.static(path.join(__dirname, 'resource')));

// Route to serve sign-up page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'sign-up.html'));
});


// Route to serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});


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
        // res.status(201).send('<h1 style="color: blue, text-align:center  ">File uploaded successfully.</h1>');
        // res.status(201).send('<h1 style="color: lightblue; text-align: center;">File uploaded successfully.</h1>');



        res.status(201).send(`
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                <h1 style="color: lightblue; text-align: center;">File uploaded successfully.</h1>
            </div>


             <script>
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    </script>
        `);
        


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


//login validation


app.post('/loginvalid', async (req,res)=>{

    const { email, role, password } = req.body;

    console.log("email, role", email, role);

    try{

        const userEmployee = await Employee.findOne({ email, role })

        console.log("user....", userEmployee);

        if(!userEmployee)
            {

                return res.status(400).send("Email or Role is Invalid, check properly")
            }


        const userPasswordObject=await   PasswordSchema.findOne({role, password})   

        if(!userPasswordObject)
            {

                return res.status(400).send('Invalid password');
            }

        else if(role=='entry_specialist')
            {

                return res.redirect('/');
            }
            // res.status(200).send('Login successful');

            else{


                return res.redirect('/dashboard');
            }


    }
    catch(err){


        res.status(500).send(err.message);

    }






})




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

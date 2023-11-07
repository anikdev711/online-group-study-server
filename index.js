

const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 5000;


//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}));




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wxasryf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //create collections

    const assignmentCollection = client.db('groupStudy').collection('assignments');
    const userCollection = client.db('groupStudy').collection('users');
    const submittedAssignmentCollection = client.db('groupStudy').collection('submissions');


    //verify token middleware
    const verifyUserForAssignment = (req, res, next) => {
      const { token } = req.cookies
      console.log(token);
      if (!token) {
        return res.status(401).send({ message: "you are not authorized" });
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "forbidden" })
        }
        req.user = decoded;
        next();
      })
    }







    //get assignments
    app.get('/api/v1/assignments', async (req, res) => {
      const cursor = assignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    //create or post assignments
    app.post('/api/v1/assignments', verifyUserForAssignment, async (req, res) => {
      const assignment = req.body;
      console.log(assignment);
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    })

    //update assignment
    app.put('/api/v1/assignments/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      }
      const updateAssignments = req.body;
      const updatedFields = {
        $set: {
          title: updateAssignments.title,
          thumbnailImageURL: updateAssignments.thumbnailImageURL,
          difficulty: updateAssignments.difficulty,
          marks: updateAssignments.marks,
          dueDate: updateAssignments.dueDate,
          userEmail: updateAssignments.userEmail,
          description: updateAssignments.description
        }
      }
      const result = await assignmentCollection.updateOne(filter, updatedFields);
      res.send(result);
    })

    //delete assignment
    app.delete('/api/v1/assignments/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    })





    //submission related

    //get the submitted assignments
    app.get('/api/v1/submissions', async (req, res) => {
      const cursor = submittedAssignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })



    //post submission assignment
    app.post('/api/v1/submissions', async (req, res) => {
      const submission = req.body;
      console.log(submission);
      const result = await submittedAssignmentCollection.insertOne(submission);
      res.send(result);

    })

    // patch for submitted assignments
    app.patch('/api/v1/submissions/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      }
      const evaluationAssignment = req.body;
      console.log(evaluationAssignment);
      const updatedStatus = {
        $set: {
          status: evaluationAssignment.status,
          obtainedMarks: evaluationAssignment.obtainedMarks,
          feedback: evaluationAssignment.feedback
        }
      }
      const result = await submittedAssignmentCollection.updateOne(filter, updatedStatus)
      res.send(result);
    })





    //user related 

    //user create
    app.post('/api/v1/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    })


    //jwt related
    app.post('/api/v1/auth/user-token', (req, res) => {
      const userToken = req.body;
      const token = jwt.sign(userToken, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      console.log(token);
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      }).send({ success: true })
    })













    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

















app.get('/', (req, res) => {
  res.send('Online study group server is running successfully')
})

app.listen(port, () => {
  console.log(`Group study is listening on port ${port}`)
})
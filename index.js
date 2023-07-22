const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gu0z5kw.mongodb.net/houseHunter?retryWrites=true&w=majority`;

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

        const usersCollection = client.db('collegeBooking').collection('user');
        const collegesCollection = client.db('collegeBooking').collection('colleges');

        // User Added API in the MONGODB Database
        app.post('/user', async (req, res) => {
            try {
                const body = req.body;
                const existingUser = await usersCollection.findOne({ email: body.email });

                if (existingUser) {
                    // If the user already exists, return an error response
                    return res.status(400).json({ error: "User already exists." });
                }

                const result = await usersCollection.insertOne(body);
                res.send(result)
            } catch (error) {
                console.error("Error during user signup:", error);
                res.status(500).json({ error: "An internal server error occurred." });
            }
        });

        // Get All College Data
        app.get('/colleges', async (req, res) => {
            try {
                const allColleges = await collegesCollection.find({}).toArray();
                res.json(allColleges);
            } catch (error) {
                console.error("Error retrieving colleges data:", error);
                res.status(500).json({ error: "An internal server error occurred." });
            }
        });







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



// Ping Endpoint
app.get("/", (req, res) => {
    res.send("College Booking Server is running");
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
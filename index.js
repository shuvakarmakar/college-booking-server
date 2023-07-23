const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const admissionCollection = client.db('collegeBooking').collection('admission');

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

        // API endpoint for handling admission data
        app.post("/admission", async (req, res) => {
            try {
                const body = req.body;
                const existingAdmission = await admissionCollection.findOne({
                    college: body.college,
                    candidateEmail: body.candidateEmail,
                });

                if (existingAdmission) {
                    return res.status(400).json({ error: "You have already submitted the admission form for this college." });
                }

                const result = await admissionCollection.insertOne(body);
                res.send(result);
            } catch (error) {
                console.error("Error during admission submission:", error);
                res.status(500).json({ error: "An internal server error occurred." });
            }
        });

        // GET college data based on user's email
        app.get("/colleges/:email", async (req, res) => {
            const userEmail = req.params.email;

            try {
                const college = await admissionCollection.findOne({ candidateEmail: userEmail });
                if (!college) {
                    return res.status(404).json({ error: "No college data found for the user." });
                }
                res.json(college);
            } catch (error) {
                console.error("Error fetching college data:", error);
                res.status(500).json({ error: "An internal server error occurred." });
            }
        });

        // GET college data based on college ID
        app.get('/college-details/:id', (req, res) => {
            const collegeId = req.params.id;

            collegesCollection.findOne({ _id: new ObjectId(collegeId) })
                .then((college) => {
                    if (college) {
                        res.send(college);
                    } else {
                        res.status(404).json({ error: 'College not found' });
                    }
                })
                .catch((error) => {
                    console.error('Error fetching college data:', error);
                    res.status(500).json({ error: 'An internal server error occurred.' });
                });
        });

        // Search colleges by name
        app.get('/search', async (req, res) => {
            try {
                const query = req.query.query;
                const searchRegex = new RegExp(query, 'i');

                const searchResults = await collegesCollection.find({ collegeName: searchRegex }).toArray();

                res.json(searchResults);
            } catch (error) {
                console.error('Error fetching search results:', error);
                res.status(500).json({ error: 'An internal server error occurred.' });
            }
        });

        //For Posting Review 
        app.post("/colleges/:id", async (req, res) => {
            const collegeId = req.params.id;
            const { review, rating } = req.body;

            try {
                const admission = await admissionCollection.findOne({ _id: new ObjectId(collegeId) });
                if (!admission) {
                    return res.status(404).json({ error: "Admission not found." });
                }

                if (!admission.reviews) {
                    admission.reviews = [];
                }
                admission.reviews.push({ review, rating });
                await admissionCollection.updateOne({ _id: new ObjectId(collegeId) }, { $set: admission });

                res.json({ message: "Review added successfully." });
            } catch (error) {
                console.error("Error adding review:", error);
                res.status(500).json({ error: "An internal server error occurred." });
            }
        });


        // API endpoint to get admission details with reviews and ratings
        app.get("/admissions-with-reviews", async (req, res) => {
            try {
              const admissionsWithReviews = await admissionCollection
                .find({ reviews: { $exists: true, $not: { $size: 0 } } })
                .toArray();
          
              res.json(admissionsWithReviews);
            } catch (error) {
              console.error("Error fetching admission details with reviews:", error);
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
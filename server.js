const express = require("express");
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const Itinerary = require('./models/itineraryModel');
const User = require('./models/userModel');

app.use(cors({origin: '*'}));
app.use(express.json());

const PORT = 3000;

//root directory
app.get('/', (req, res) => {
    res.send("hello node and Express API!");
});

//Register new user
app.post('/user', async (req, res) => {
    try {
        const user = await User.create({
            // Ensure that you're passing the fields as defined in your Mongoose schema
            fName: req.body.fName,
            lName: req.body.lName,
            username: req.body.username,
            password: req.body.password, // Please remember to hash your passwords in a real-world application
        });
        
        // Responding back without sending sensitive info like password
        const userResponse = {
            _id: user._id,
            fName: user.fName,
            lName: user.lName,
            username: user.username
        };
        res.status(200).json(userResponse);
    }
    catch(error) {
        console.error(error.message);
        res.status(500).json({message: "An error occurred while creating the account."});
    }
});

//login
app.get('/login', async (req, res) => {
    try {
        const { username, password } = req.query;

        // Check if username and password match a user in the database
        const user = await User.findOne({ username, password });

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(401).json({ success: false });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
});

// get all itineraries
app.get('/itineraries', async (req, res) => {
    try {
        const itineraries = await Itinerary.find({}).lean();
        res.status(200).json(itineraries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/userItineraries', async (req, res) => {
    const { userId } = req.query;     // Filter itineraries based on userId
    try {
        const itineraries = await Itinerary.find({ user: userId });
        res.json(itineraries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/itineraries', async (req, res) => {
    // try {
    //     const newItinerary = new Itinerary(req.body);
    //     await newItinerary.save();
    //     res.status(201).json(newItinerary);
    // } catch (error) {
    //     res.status(500).json({ error: error.message });
    // }
    // Format the dates to ensure no time data is included
    req.body.startDate = new Date(req.body.startDate).toISOString().slice(0, 10);
    req.body.endDate = new Date(req.body.endDate).toISOString().slice(0, 10);

    // Update activities dates
    req.body.activities.forEach(activity => {
        activity.date = new Date(activity.date).toISOString().slice(0, 10);
    });

    try {
        const newItinerary = await Itinerary.create(req.body); // Use `.create` for direct insertion
        res.status(201).json(newItinerary);
    } catch (err) {
        res.status(500).json({ message: "Failed to create itinerary", error: err.message });
    }
});

app.get('/itineraries/:id', async (req, res) => {
    const itineraryId = req.params.id;
    try {
        const itinerary = await Itinerary.findById(itineraryId).exec();
        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }
        res.json(itinerary);
    } catch (err) {
        console.error('Error finding itinerary by ID:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Mongoose connection
mongoose.connect('mongodb+srv://adibhalizam:adibhalizam@travelsharemern-cluster.rlsukhf.mongodb.net/Node-API')
    .then(() => {
        console.log("Successfully connect to mongodb");
        app.listen(PORT, () => {
            console.log(`Node API is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log(error);
    });
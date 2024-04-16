const express = require("express");
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const Itinerary = require('./models/itineraryModel');
const User = require('./models/userModel');
const FavoriteItinerary = require('./models/favouriteItineraryModel');

// Middleware
app.use(cors({origin: '*'})); // Allow CORS from all origins
app.use(express.json()); // Parse JSON request bodies

const PORT = 3000;

//root directory
app.get('/', (req, res) => {
    res.send("hello node and Express API!");
});

// Register new user
app.post('/user', async (req, res) => {
    try {
        // Create a new user with the provided data
        const user = await User.create({
            fName: req.body.fName,
            lName: req.body.lName,
            username: req.body.username,
            password: req.body.password,
        });
        
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

// Retrieve user details by ID
app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Login endpoint    
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

// Retrieve all itineraries
app.get('/itineraries', async (req, res) => {
    try {
        const itineraries = await Itinerary.find({}).lean();
        res.status(200).json(itineraries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Retrieve itineraries by user ID
app.get('/userItineraries', async (req, res) => {
    const { userId } = req.query;     // Filter itineraries based on userId
    try {
        const itineraries = await Itinerary.find({ user: userId });
        res.json(itineraries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new itinerary
app.post('/itineraries', async (req, res) => {
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

// Retrieve itinerary by ID
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

// Update itinerary by ID
app.put('/itineraries/:id', (req, res) => {
    const itineraryId = req.params.id;
    const updatedItineraryData = req.body;

    Itinerary.findByIdAndUpdate(itineraryId, updatedItineraryData, { new: true })
        .then(updatedItinerary => {
            if (!updatedItinerary) {
                return res.status(404).json({ error: 'Itinerary not found' });
            }
            res.json(updatedItinerary);
        })
        .catch(error => {
            console.error('Error updating itinerary:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Delete itinerary by ID
app.delete('/itineraries/:id', async (req, res) => {
    const itineraryId = req.params.id;

    try {
        // Find and delete itinerary by ID
        const deletedItinerary = await Itinerary.findByIdAndDelete(itineraryId);
        if (!deletedItinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }
        res.json({ message: 'Itinerary deleted successfully' });
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add comment to an itinerary
app.put('/itineraries/:id/addComment', async (req, res) => {
    const itineraryId = req.params.id;
    const { userId, commentText } = req.body;

    try {
        const itinerary = await Itinerary.findById(itineraryId);

        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create the comment object
        const comment = {
            user: userId,
            text: commentText,
            createdAt: Date.now()

        };

        // Add the comment to the itinerary's comments array
        itinerary.comments.push(comment);
        await itinerary.save();

        res.status(201).json({ message: 'Comment added successfully', comment });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete comment from an itinerary
app.put('/itineraries/:id/deleteComment/:commentId', async (req, res) => {
    try {
        const { id, commentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ error: 'Invalid IDs' });
        }

        const updatedItinerary = await Itinerary.findByIdAndUpdate(
            id,
            { $pull: { comments: { _id: commentId } } },
            { new: true }
        );

        if (!updatedItinerary) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
});

// Add itinerary to favorite
app.post('/addFavoriteItinerary', async (req, res) => {
    try {
        const favorite = await FavoriteItinerary.create(req.body);
        res.status(200).json(favorite);
    } catch(error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
});

// Remove itinerary from favorite
app.delete('/removeFavoriteItinerary', async (req, res) => {
    try {
        const favorite = await FavoriteItinerary.findOneAndDelete(req.body);
        res.status(200).json(favorite);
    } catch(error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
});

// Get favorite itineraries for a user
app.get('/getFavoriteItineraries', async (req, res) => {
    const { user } = req.query; // User ID

    try {
        // Find all favorite itineraries for the user
        const favoriteItineraries = await FavoriteItinerary.find({ user });

        res.json(favoriteItineraries);
    } catch (error) {
        console.error('Error fetching favorite itineraries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Retrieve favorite count by itineraryId
app.get('/getFavoriteCount/:itineraryId', async (req, res) => {
    const { itineraryId } = req.params;

    try {
        const favoriteCount = await FavoriteItinerary.countDocuments({ itinerary: itineraryId });
        res.json({ favoriteCount });
    } catch (error) {
        console.error('Error fetching favorite count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Edit profile
app.put('/user/:id', async (req, res) => {
    try {
        const { fName, lName, password } = req.body;
        const userUpdates = { fName, lName };

        if (password) {
            userUpdates.password = password;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            userUpdates,
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Respond without sending sensitive data
        const { password: _, ...userData } = updatedUser._doc;
        res.json(userData);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: "Internal Server Error" });
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

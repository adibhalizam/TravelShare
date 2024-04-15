const express = require("express");
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const Itinerary = require('./models/itineraryModel');
const User = require('./models/userModel');
const FavoriteItinerary = require('./models/favouriteItineraryModel');


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

app.delete('/itineraries/:id', async (req, res) => {
    const itineraryId = req.params.id;

    try {
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

        // Assuming you have a User model and you want to associate the comment with a user
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

app.post('/itineraries/:id/like', async (req, res) => {
    const itineraryId = req.params.id;
    const userId = req.body.userId; // The ID of the user liking the itinerary
    const like = req.body.like; // Boolean indicating whether the action is a like (true) or unlike (false)

    try {
        const itinerary = await Itinerary.findById(itineraryId);

        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }
        
        // Check if the user has already liked the itinerary
        const index = itinerary.likes.indexOf(userId);

        // Toggle the user's like status
        if (like) {
            // If the user is liking the itinerary and hasn't liked it before
            if (index === -1) {
                itinerary.likes.push(userId);
            }
        } else {
            // If the user is unliking the itinerary and has liked it before
            if (index > -1) {
                itinerary.likes.splice(index, 1);
            }
        }
        
        // Save the updated itinerary
        await itinerary.save();
        res.status(200).json(itinerary);
    } catch (error) {
        console.error('Error liking/unliking itinerary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/addFavoriteItinerary', async (req, res) => {
    try {
        const favorite = await FavoriteItinerary.create(req.body);
        res.status(200).json(favorite);
    } catch(error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
});

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

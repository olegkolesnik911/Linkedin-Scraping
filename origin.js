
const uri = "mongodb+srv://admin:OuYn0rAeFVp7FRvA@cluster0.vaojycr.mongodb.net/?retryWrites=true&w=majority";
const dbUri = "mongodb+srv://admin:OuYn0rAeFVp7FRvA@cluster0.vaojycr.mongodb.net/LinkedinScrap?retryWrites=true&w=majority";

// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const unirest = require("unirest");
// Create an Express app
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Get the default connection
const db = mongoose.connection;

// Listen for the connected event
db.on('connected', () => {
    console.log('Connected to MongoDB');
});

// Listen for the error event
db.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

// Define the Credit model
const Credit = mongoose.model('credits', {
    apiKey: String,
    availableCredits: Number,
});


const getLinkedinProfile = (apiKey, email) => {
    return new Promise((resolve, reject) => {

        var req = unirest("GET", "https://api.reversecontact.com/enrichment");
        req.timeout(1000000);
        req.query({
            "apikey": apiKey,
            "mail": email
        });

        req.headers({
            "accept": "application/json",
            "content-type": "application/json"
        });

        req.end(function (res) {
            console.log(res.body);
            resolve(res.body);
        });
    });
};

// Define the CreditController
const CreditController = {
    getAllCredits: async (req, res) => {
        console.log(435);
        try {
            const credits = await Credit.find();
            res.json(credits);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deleteCredit: async (req, res) => {
        try {
            const apiKeyToDelete = req.params.apiKey; // Assuming the API key is passed as a route parameter

            const deletedCredit = await Credit.findOneAndDelete({ apiKey: apiKeyToDelete });

            if (deletedCredit) {
                console.log('Credit deleted successfully:', deletedCredit);
                res.status(200).json({ message: 'Credit deleted successfully' });
            } else {
                console.log('No credit found with the specified API key.');
                res.status(404).json({ message: 'No credit found with the specified API key' });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    useCredit: async (req, res) => {
        const { email } = req.body;
        var randomCredit;
        try {
            randomCredit = await Credit.aggregate([{ $sample: { size: 1 } }]);

            if (randomCredit.length > 0) {
                // console.log('Random credit:', randomCredit[0]);
                const apiKey = randomCredit[0].apiKey;
                // const apiKey = "sk_live_6505f987d09ca705f07f882e_key_cvujn36fwb";
                console.log(apiKey);
                const profile = await getLinkedinProfile(apiKey, email);
                if (profile.success) {

                    const credits_left = profile.credits_left;
                    if (credits_left > 0) {
                        const updatedCredit = await Credit.findOneAndUpdate(
                            { apiKey },
                            { $set: { availableCredits: credits_left } },
                            { new: true }
                        );

                        console.log(updatedCredit);
                    } else {
                        const deletedCredit = await Credit.findOneAndDelete({ apiKey });
                        console.log(deletedCredit);
                    }
                    res.json(profile);
                    
                } else {
                    const deletedCredit = await Credit.findOneAndDelete({ apiKey });
                    console.log(deletedCredit);

                    CreditController.useCredit(req, res);
                }

            } else {
                console.log('No credits found.');
                res.status(404).json({ message: 'No credits found.' });
            }

        } catch (error) {
            // CreditController.useCredit(req, res);
            console.error('Error:', error);
            res.status(500).json({ message: 'Internal server error.', apiKey: randomCredit[0].apiKey });
        }
    },

    createCredit: async (req, res) => {
        try {
            const { apiKey, availableCredits, } = req.body;
            console.log(req.body);
            const credit = new Credit({ apiKey, availableCredits });
            await credit.save();
            res.json(credit);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getSumCredits: async (req, res) => {
        try {
            const result = await Credit.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCredits: { $sum: '$availableCredits' }
                    }
                }
            ]);

            if (result.length > 0) {
                const totalCredits = result[0].totalCredits;
                console.log('Total available credits:', totalCredits);
                res.json({ totalCredits });
            } else {
                console.log('No credits found.');
                res.status(404).json({ message: 'No credits found.' });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    },
};

// Define the credit routes
const creditRouter = express.Router();
creditRouter.get('/', CreditController.getAllCredits);
creditRouter.post('/', CreditController.createCredit);
creditRouter.get('/totalCredits', CreditController.getSumCredits);
creditRouter.post('/useCredit', CreditController.useCredit);

// Register the credit routes
app.use('/credits', creditRouter);

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
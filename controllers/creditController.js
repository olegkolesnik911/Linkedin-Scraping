const Credit = require('../models/credit');
const { getLinkedinProfile } = require("../utils/apiRequest");

const getAllCredits = async (req, res) => {
    console.log(435);
    try {
        const credits = await Credit.find();
        res.json(credits);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteCredit = async (req, res) => {
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
};

const useCredit = async (req, res) => {
    const { email } = req.body;
    var profile;
    var randomCredit;
    try {
        randomCredit = await Credit.aggregate([{ $sample: { size: 1 } }]);

        if (randomCredit.length > 0) {
            // console.log('Random credit:', randomCredit[0]);
            const apiKey = randomCredit[0].apiKey;
            // const apiKey = "sk_live_6505f4e49187b805edef1219_key_rsuztnidd8";
            console.log(apiKey);
            profile = await getLinkedinProfile(apiKey, email);
            // console.log(profile);
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
                useCredit(req, res);
            }

        } else {
            console.log('No credits found.');
            res.status(404).json({ message: 'No credits found.' });
        }

    } catch (error) {
        useCredit(req, res);

        // console.error('Error:', error);
        // console.log("---------------");
        // console.log(randomCredit);
        // console.log(profile);
        // console.log("---------------");
        // res.status(500).json({ message: 'Internal server error.'});
    }
};

const createCredit = async (req, res) => {
    try {
        const { apiKey, availableCredits, } = req.body;
        console.log(req.body);
        const credit = new Credit({ apiKey, availableCredits });
        await credit.save();
        res.json(credit);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getSumCredits = async (req, res) => {
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
};

module.exports = {
    getAllCredits,
    useCredit,
    createCredit,
    getSumCredits,
    deleteCredit,
};
const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const util = require('util');

const app = express();
app.use(express.json());

const client = new textToSpeech.TextToSpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './gcp-service-account.json'
});

app.post('/synthesize', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Configure the TTS request
        const request = {
            input: { text },
            voice: {
                languageCode: 'en-US',
                name: 'en-US-Neural2-J', // Casual young male voice
                ssmlGender: 'MALE'
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 1.1, // Slightly faster for energy
                pitch: 0.5, // Slightly higher for Gen-Z vibe
            }
        };

        // Perform the text-to-speech request
        const [response] = await client.synthesizeSpeech(request);

        // Return the audio content
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.audioContent);
    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
    console.log(`TTS service running on http://localhost:${PORT}`);
});

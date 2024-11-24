import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Get API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('No API key found. Please set GEMINI_API_KEY in your .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
};

const storageFile = join(__dirname, 'storage.json');

// Enhanced error handling for storage operations
function readStorage() {
  try {
    if (!fs.existsSync(storageFile)) {
      return { chats: [], messages: {} };
    }
    const data = fs.readFileSync(storageFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading storage:', error);
    return { chats: [], messages: {} };
  }
}

function writeStorage(data) {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing storage:', error);
    return false;
  }
}

// Initialize storage.json if not present
if (!fs.existsSync(storageFile)) {
  writeStorage({ chats: [], messages: {} });
}

// API endpoints
app.post('/api/chat/new', (req, res) => {
  try {
    const storage = readStorage();
    const newChatId = storage.chats.length ? Math.max(...storage.chats.map(c => c.id)) + 1 : 1;
    const newChat = { 
      id: newChatId, 
      name: `Chat ${newChatId}`, 
      created_at: new Date().toISOString() 
    };

    storage.chats.push(newChat);
    storage.messages[newChatId] = [];
    
    if (!writeStorage(storage)) {
      throw new Error('Failed to write storage');
    }

    res.json({ chatId: newChatId });
  } catch (error) {
    console.error('Error creating new chat:', error);
    res.status(500).json({ error: 'Failed to create new chat' });
  }
});

app.post('/api/generate', async (req, res) => {
  const { chatId, prompt: userPrompt } = req.body;
  
  if (!chatId || !userPrompt) {
    return res.status(400).json({ error: 'Missing chatId or prompt' });
  }

  const storage = readStorage();
  
  const parts = [
    { text: "input: you are an intelligent education model who helps students learn better." },
    { text: "output: I am an educational tool designed to help students understand concepts, solve problems, and develop their knowledge. I'll provide clear explanations and guide you through learning step by step.\n\nHow can I assist with your learning today?" },
    { text: "input: whenever a question is asked to you, you should first give the correct answer to it, and then you should explain how you arrived at that answer using bullet points" },
    { text: "output: I'll follow this format for all questions:\n1. First, I'll provide the direct answer\n2. Then, I'll explain my reasoning using clear bullet points\n\nWhat would you like to learn about?" },
    { text: `input: ${userPrompt}` },
  ];

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
    });

    const aiResponse = result.response.text();
    const timestamp = new Date().toISOString();

    if (!storage.messages[chatId]) {
      storage.messages[chatId] = [];
    }

    storage.messages[chatId].push(
      { sender: 'user', content: userPrompt, timestamp },
      { sender: 'ai', content: aiResponse, timestamp }
    );

    if (!writeStorage(storage)) {
      throw new Error('Failed to save messages');
    }

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate or save content' });
  }
});

app.get('/api/chats', (req, res) => {
  try {
    const storage = readStorage();
    res.json(storage.chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.get('/api/messages/:chatId', (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId, 10);
    const storage = readStorage();
    const messages = storage.messages[chatId] || [];
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.put('/api/chat/rename/:chatId', (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId, 10);
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ error: 'New name is required' });
    }

    const storage = readStorage();
    const chat = storage.chats.find(chat => chat.id === chatId);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.name = newName;
    if (!writeStorage(storage)) {
      throw new Error('Failed to save chat rename');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error renaming chat:', error);
    res.status(500).json({ error: 'Failed to rename chat' });
  }
});

app.delete('/api/chat/delete/:chatId', (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId, 10);
    const storage = readStorage();
    const chatIndex = storage.chats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    storage.chats.splice(chatIndex, 1);
    delete storage.messages[chatId];
    
    if (!writeStorage(storage)) {
      throw new Error('Failed to save chat deletion');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Make sure you have set up your .env file with GEMINI_API_KEY`);
});
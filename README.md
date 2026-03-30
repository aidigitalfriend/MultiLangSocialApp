# Voice 4U (V4U)

A WhatsApp-like platform with real-time translation, voice cloning, and social features.

## Features
- Multi-language support with automatic translation
- Real-time messaging and calls
- Voice cloning for personalized audio
- Friend system via user ID/phone

## Tech Stack
- Backend: Node.js, Express, Socket.io, Azure AI
- Frontend: React Native (Expo)
- Database: PostgreSQL (AWS RDS)
- Deployment: AWS EC2, Nginx

## Setup
1. Backend: `cd backend && npm install && node server.js`
2. Frontend: `cd frontend && npm install && npm start`
3. Deploy: Sync to EC2, restart PM2

## API
- POST /signup: { phone, language, voiceSample }
- Socket: sendMessage, receiveMessage

## Domain
v4u.ai (SSL pending DNS setup)
# Configuration Requirements

This document lists all the required environment variables and configuration settings needed to run the modlr application.

## Frontend Environment Variables

Create a `.env.local` file in the `resyft-frontend` directory with the following variables:

### Required Variables

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Get from [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Get from [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > API |
| `XAI_API_KEY` | xAI API key for CAD AI generation | Get from [xAI Console](https://console.x.ai/) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_AI_SERVICE_URL` | AI service URL | `http://localhost:3000/api` |
| `OPEN_ROUTER_API_KEY` | OpenRouter API key (for research features) | - |
| `OPEN_ROUTER_MODEL` | OpenRouter model to use | `google/gemini-2.5-flash-lite` |

## Example .env.local File

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:3000/api

# xAI API Key for CAD Generation (REQUIRED for CAD features)
XAI_API_KEY=xai-your-api-key-here

# OpenRouter API Key (Optional - for research features)
OPEN_ROUTER_API_KEY=sk-or-v1-your-key-here
OPEN_ROUTER_MODEL=google/gemini-2.5-flash-lite
```

## Setup Instructions

### 1. Supabase Setup

1. Create an account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Project Settings > API
4. Copy the **Project URL** to `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon/public** key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. xAI API Setup (Required for CAD AI Features)

1. Create an account at [xAI](https://console.x.ai/)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key to `XAI_API_KEY`

The CAD assistant uses the `grok-3-fast` model for generating 3D shapes from natural language descriptions.

### 3. OpenRouter Setup (Optional)

1. Create an account at [OpenRouter](https://openrouter.ai)
2. Go to [API Keys](https://openrouter.ai/keys)
3. Create a new API key
4. Copy the key to `OPEN_ROUTER_API_KEY`

## Running the Application

1. Install dependencies:
   ```bash
   cd resyft-frontend
   npm install
   ```

2. Create your `.env.local` file with the required variables

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting

### "XAI API key not configured" Error
- Ensure `XAI_API_KEY` is set in your `.env.local` file
- Restart the development server after adding environment variables

### Supabase Connection Issues
- Verify your Supabase project URL is correct
- Check that the anon key matches your project
- Ensure your Supabase project is active (not paused)

### CAD AI Not Responding
- Check that your xAI API key is valid and has available credits
- Verify the API key has the correct permissions

## Security Notes

- Never commit `.env.local` to version control
- Keep API keys secure and rotate them periodically
- Use environment variables in production (Vercel, Netlify, etc.)
- The `.env.local` file is already in `.gitignore`

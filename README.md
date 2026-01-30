# Eureka - Internal Idea Submission Platform

A modern web application for collecting, developing, and voting on feature and product ideas within your organization.

## Features

- **Two Idea Types**
  - **Feature Ideas**: Quick submissions for product improvements
  - **Product Ideas**: AI-assisted development workshop to refine bigger ideas

- **AI-Powered Development**: Claude AI helps users refine product ideas through guided questions

- **Voting System**: Upvote ideas to help prioritize what matters most

- **Comments**: Discuss and provide feedback on submitted ideas

- **Leaderboard**: See top-voted ideas with filtering and search

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: Anthropic Claude API

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Console project (for OAuth)
- Anthropic API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in the required values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/eureka?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Configure the consent screen
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

### 4. Set Up the Database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth.js routes
│   │   ├── ideas/                  # Ideas CRUD API
│   │   └── ai/develop/             # AI workshop API
│   ├── auth/signin/                # Sign-in page
│   ├── ideas/[id]/                 # Idea detail page
│   ├── my-ideas/                   # User's ideas
│   ├── profile/                    # User profile
│   └── submit/                     # Idea submission flow
│       ├── feature/                # Feature idea form
│       └── product/                # Product idea + AI workshop
├── components/
│   ├── ideas/                      # Idea-related components
│   ├── layout/                     # Layout components (header)
│   ├── providers/                  # Context providers
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── auth.ts                     # NextAuth configuration
│   ├── prisma.ts                   # Prisma client
│   └── utils.ts                    # Utility functions
└── types/
    └── next-auth.d.ts              # NextAuth type extensions
```

## Database Schema

- **User**: Authenticated users (via NextAuth)
- **Idea**: Submitted ideas (feature or product)
- **Vote**: User votes on ideas (one per user per idea)
- **Comment**: User comments on ideas

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- Self-hosted with Node.js

## License

MIT

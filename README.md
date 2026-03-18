# Playcall

Skill-based sports predictions. No money, all thrill.

## What It Is

Playcall replaces sports betting with a skill-based competition platform. Pick game winners, earn points through accuracy, boldness, and streaks — no wallet required.

## Scoring

- **Accuracy Points**: +10 for correct pick
- **Boldness Multiplier**: Underdog picks multiply your points (up to 3x)
- **Streak Bonus**: 3 in a row = +5, 5 = +15, 10 = +50

## Stack

- **Web**: Next.js 15 (Vercel)
- **Mobile**: Expo + React Native (iOS/Android)
- **Backend**: Supabase (auth, database, real-time)

## Setup

### 1. Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Optionally run `supabase/seed.sql` for sample games
4. Copy your project URL and anon key

### 2. Web (Vercel)
```bash
cd web
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Deploy to Vercel: connect repo, add env vars, deploy.

### 3. Mobile (Expo)
```bash
cd mobile
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run start
```

For App Store submission:
```bash
npm install -g eas-cli
eas login
eas build --platform ios
```

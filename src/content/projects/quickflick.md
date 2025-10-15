---
title: QuickFlick
description: A unique way to find movies.
pubDate: 2025-05-28
demoURL: https://quickflick-liard.vercel.app
repoURL: https://github.com/joayo13/quickflick
---

![quickflick app](/quickflick.png)

QuickFlick is a movie-finding web app built with Next.js, Shadcn/Tailwind for styling, Supabase for user auth and database, and uses TMDB/Just Watch for API data.

The challenge was to create a movie-finding app that was simple but fun to use. Right when you open the app, you can immediately swipe left or right to dismiss/save movies. This felt more enjoyable than the typical UIs used in these apps, which for me felt like information overload.

You can filter based on Watch Providers, so instead of bouncing around your different streaming apps you can look in one place. It also has filters for which genres to include/exclude, a rating min/max, and a year min/max.

I used the framer motion library to handle the swiping animations in the dashboard, and the experimental view transitions API for the watchlist animations. I used zustand to handle state management, and used a mixture of localstorage and supabase's postgres database to persist the users preferences.

I hit the TMDB API to get trailers for any given movie, which can be previewed by toggling the trailer button while in the dashboard.

I track which movies have been previously discarded, so that I can show them last in future searches, so that the user is always getting to see new movies that they're more likely to be interested in.

You can try it yourself by continuing as a guest. This will log you into the application with a shared guest account that just uses local storage. You can experiment with the all of the features, and if you want to, create an account some other time.

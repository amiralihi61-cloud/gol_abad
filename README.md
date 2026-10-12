# Gol Abad Music

A simple static Spotify-inspired music site for personal listening. It works on GitHub Pages without a backend or database.

## Features

- No login or signup
- Artist homepage with circular covers
- Per-artist page with song list
- Search by artist or song title
- Fixed bottom media player with controls
- Shuffle all and shuffle artist buttons
- Data-driven content from `data.json`
- Local cover and audio files in `covers/` and `music/`
- Custom theme colors via CSS variables
- Works on GitHub Pages

## Deploy to GitHub Pages

1. Push this project to a GitHub repo.
2. Open the repo on GitHub.
3. Go to Settings → Pages.
4. Choose the `main` branch and the `/root` folder.
5. Save.
6. GitHub will provide a URL like:
   `https://<your-username>.github.io/<repo-name>/`

## Add a new artist or song

Edit only `data.json`.

Example:

```json
{
  "artists": [
    {
      "id": "artist-5",
      "name": "New Artist",
      "cover": "covers/artist-5.svg"
    }
  ],
  "songs": [
    {
      "id": "song-9",
      "title": "New Song",
      "artistId": "artist-5",
      "audioPath": "music/track-9.txt"
    }
  ]
}
```

Rules:
- Add the image to `covers/`
- Add the audio config file to `music/`
- Use unique IDs for each artist and song
- No code changes are needed for new content

## Customize the theme

The theme is controlled by CSS variables in `styles.css`:

```css
:root {
  --ml-accent: #1db954;
  --ml-accent-strong: #1ed760;
  --ml-bg: #121212;
  --ml-bg-alt: #181818;
  --ml-surface: #202020;
  --ml-surface-2: #2a2a2a;
  --ml-text: #f5f5f5;
  --ml-muted: #b3b3b3;
}
```

Change those values to recolor the whole site.

## Local media

This project does not use external CDNs or hosted media. Everything is local and static, which makes it reliable in restricted networks.

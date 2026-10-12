const state = {
  artists: [],
  songs: [],
  currentArtistId: null,
  currentPlaylist: [],
  currentIndex: 0,
  audio: new Audio(),
};

const elements = {
  artistsGrid: document.getElementById('artists-grid'),
  homeView: document.getElementById('home-view'),
  artistView: document.getElementById('artist-view'),
  artistCover: document.getElementById('artist-cover'),
  artistName: document.getElementById('artist-name'),
  artistSongCount: document.getElementById('artist-song-count'),
  artistSongs: document.getElementById('artist-songs'),
  searchInput: document.getElementById('search-input'),
  searchResults: document.getElementById('search-results'),
  shuffleAll: document.getElementById('shuffle-all'),
  backHome: document.getElementById('back-home'),
  artistShuffle: document.getElementById('artist-shuffle'),
  brandButton: document.getElementById('brand-button'),
  playButton: document.getElementById('play-button'),
  prevButton: document.getElementById('prev-button'),
  nextButton: document.getElementById('next-button'),
  progressBar: document.getElementById('progress-bar'),
  volumeControl: document.getElementById('volume-control'),
  timeCurrent: document.getElementById('time-current'),
  timeDuration: document.getElementById('time-duration'),
  playerTitle: document.getElementById('player-title'),
  playerArtist: document.getElementById('player-artist'),
  playerCover: document.getElementById('player-cover'),
};

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function findArtistById(id) {
  return state.artists.find((artist) => artist.id === id);
}

function findArtistSongs(artistId) {
  return state.songs.filter((song) => song.artistId === artistId);
}

function getSongArtist(song) {
  const artist = findArtistById(song.artistId);
  return artist ? artist.name : 'Unknown artist';
}

function setPageView(viewName) {
  elements.homeView.hidden = viewName !== 'home';
  elements.artistView.hidden = viewName !== 'artist';
}

function renderHome() {
  elements.artistsGrid.innerHTML = '';
  state.artists.forEach((artist) => {
    const songs = findArtistSongs(artist.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'artist-card';
    button.setAttribute('aria-label', `Open ${artist.name}`);
    button.innerHTML = `
      <img src="${artist.cover}" alt="${artist.name}" />
      <div class="artist-name">${artist.name}</div>
      <div class="artist-count">${songs.length} song${songs.length === 1 ? '' : 's'}</div>
    `;
    button.addEventListener('click', () => showArtist(artist.id));
    elements.artistsGrid.appendChild(button);
  });
}

function renderArtistView(artistId) {
  const artist = findArtistById(artistId);
  if (!artist) return;

  state.currentArtistId = artistId;
  elements.artistCover.src = artist.cover;
  elements.artistCover.alt = artist.name;
  elements.artistName.textContent = artist.name;

  const songs = findArtistSongs(artistId);
  elements.artistSongCount.textContent = `${songs.length} song${songs.length === 1 ? '' : 's'}`;
  elements.artistSongs.innerHTML = '';

  songs.forEach((song, index) => {
    const item = document.createElement('li');
    item.className = 'song-item';
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.innerHTML = `
      <span class="song-index">${index + 1}</span>
      <span class="song-text">
        <span class="song-title">${song.title}</span>
        <span class="song-meta">${artist.name}</span>
      </span>
      <span class="song-meta">▶</span>
    `;

    const playSong = () => playSongFromPlaylist(song, songs);
    item.addEventListener('click', playSong);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        playSong();
      }
    });
    elements.artistSongs.appendChild(item);
  });

  setPageView('artist');
}

function showArtist(artistId) {
  renderArtistView(artistId);
  window.location.hash = `artist/${artistId}`;
}

function goHome() {
  state.currentArtistId = null;
  setPageView('home');
  window.location.hash = '';
}

function renderSearchResults(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    elements.searchResults.hidden = true;
    elements.searchResults.innerHTML = '';
    return;
  }

  const lower = trimmed.toLowerCase();
  const artistMatches = state.artists.filter((artist) =>
    artist.name.toLowerCase().includes(lower)
  );
  const songMatches = state.songs.filter((song) =>
    song.title.toLowerCase().includes(lower)
  );

  const groups = [];
  if (artistMatches.length) {
    groups.push({ label: 'Artists', items: artistMatches.map((artist) => ({ type: 'artist', item: artist })) });
  }
  if (songMatches.length) {
    groups.push({ label: 'Songs', items: songMatches.map((song) => ({ type: 'song', item: song })) });
  }

  elements.searchResults.innerHTML = '';

  if (!groups.length) {
    elements.searchResults.innerHTML = '<div class="search-label">No matches</div>';
    elements.searchResults.hidden = false;
    return;
  }

  groups.forEach((group) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-group';

    const label = document.createElement('div');
    label.className = 'search-label';
    label.textContent = group.label;
    wrapper.appendChild(label);

    group.items.forEach(({ type, item }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-item';
      button.textContent = type === 'artist' ? item.name : `${item.title} — ${getSongArtist(item)}`;
      button.addEventListener('click', () => {
        if (type === 'artist') {
          showArtist(item.id);
        } else {
          const songs = findArtistSongs(item.artistId);
          playSongFromPlaylist(item, songs);
          showArtist(item.artistId);
        }
        elements.searchResults.hidden = true;
        elements.searchInput.value = '';
      });
      wrapper.appendChild(button);
    });

    elements.searchResults.appendChild(wrapper);
  });

  elements.searchResults.hidden = false;
}

function parseConfigText(rawText) {
  const config = {};
  rawText
    .split(/\s*;\s*/)
    .filter(Boolean)
    .forEach((entry) => {
      const [key, value] = entry.split(/\s*=\s*/);
      if (key && value) config[key.trim()] = value.trim();
    });
  return config;
}

function createToneFromConfig(config) {
  const sampleRate = 22050;
  const durationSeconds = Number.parseFloat(config.duration || '3');
  const frequency = Number.parseFloat(config.frequency || '220');
  const wave = config.wave || 'sine';
  const volume = Number.parseFloat(config.volume || '0.4');
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i += 1) {
    const time = i / sampleRate;
    let sample = 0;

    if (wave === 'square') {
      sample = Math.sin(2 * Math.PI * frequency * time) >= 0 ? 1 : -1;
    } else if (wave === 'triangle') {
      sample = 2 * Math.abs(2 * ((frequency * time) % 1) - 1) - 1;
    } else if (wave === 'sawtooth') {
      sample = 2 * ((frequency * time) % 1) - 1;
    } else {
      sample = Math.sin(2 * Math.PI * frequency * time);
    }

    const envelope = Math.min(1, time / 0.08) * Math.max(0, 1 - time / durationSeconds);
    const finalSample = sample * volume * envelope;
    view.setInt16(offset, finalSample * 32767, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return `data:audio/wav;base64,${btoa(binary)}`;
}

async function generateAudioFromTextFile(song) {
  const response = await fetch(song.audioPath);
  const rawText = await response.text();
  const config = parseConfigText(rawText);
  return createToneFromConfig(config);
}

async function playSong(song, playlist = []) {
  if (!song) return;

  const artist = findArtistById(song.artistId);
  if (!artist) return;

  const nextUrl = await generateAudioFromTextFile(song);
  if (state.audio.src !== nextUrl) {
    state.audio.src = nextUrl;
    state.audio.load();
  }

  state.audio.play();
  elements.playButton.textContent = '❚❚';
  elements.playerTitle.textContent = song.title;
  elements.playerArtist.textContent = artist.name;
  elements.playerCover.src = artist.cover;

  state.currentPlaylist = playlist.length ? playlist : findArtistSongs(song.artistId);
  state.currentIndex = state.currentPlaylist.findIndex(
    (entry) => entry.title === song.title && entry.artistId === song.artistId
  );
  if (state.currentIndex < 0) state.currentIndex = 0;

  updateProgressUI();
}

function playSongFromPlaylist(song, playlist) {
  if (!playlist.length) return;
  state.currentPlaylist = playlist;
  state.currentIndex = playlist.findIndex(
    (entry) => entry.title === song.title && entry.artistId === song.artistId
  );
  if (state.currentIndex < 0) state.currentIndex = 0;
  playSong(song, playlist);
}

function previousTrack() {
  if (!state.currentPlaylist.length) return;
  state.currentIndex = (state.currentIndex - 1 + state.currentPlaylist.length) % state.currentPlaylist.length;
  const previousSong = state.currentPlaylist[state.currentIndex];
  if (previousSong) playSong(previousSong, state.currentPlaylist);
}

function nextTrack() {
  if (!state.currentPlaylist.length) return;
  state.currentIndex = (state.currentIndex + 1) % state.currentPlaylist.length;
  const nextSong = state.currentPlaylist[state.currentIndex];
  if (nextSong) playSong(nextSong, state.currentPlaylist);
}

function shufflePlaylist(playlist) {
  if (!playlist.length) return;
  const shuffled = [...playlist].sort(() => Math.random() - 0.5);
  const firstSong = shuffled[0];
  state.currentPlaylist = shuffled;
  state.currentIndex = 0;
  playSong(firstSong, shuffled);
}

function togglePlayback() {
  if (state.audio.paused) {
    state.audio.play();
    elements.playButton.textContent = '❚❚';
  } else {
    state.audio.pause();
    elements.playButton.textContent = '▶';
  }
}

function updateProgressUI() {
  if (!Number.isFinite(state.audio.duration) || Number.isNaN(state.audio.duration)) {
    elements.timeDuration.textContent = '0:00';
  } else {
    elements.timeDuration.textContent = formatTime(state.audio.duration);
  }

  elements.timeCurrent.textContent = formatTime(state.audio.currentTime);
  if (Number.isFinite(state.audio.duration) && state.audio.duration > 0) {
    const progress = (state.audio.currentTime / state.audio.duration) * 100;
    elements.progressBar.value = String(progress);
  }
}

function bindEvents() {
  elements.searchInput.addEventListener('input', (event) => {
    renderSearchResults(event.target.value);
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-item') && !event.target.closest('.search-wrap')) {
      elements.searchResults.hidden = true;
    }
  });

  elements.playButton.addEventListener('click', togglePlayback);
  elements.prevButton.addEventListener('click', previousTrack);
  elements.nextButton.addEventListener('click', nextTrack);
  elements.brandButton.addEventListener('click', goHome);
  elements.backHome.addEventListener('click', goHome);

  elements.artistShuffle.addEventListener('click', () => {
    if (!state.currentArtistId) return;
    shufflePlaylist(findArtistSongs(state.currentArtistId));
  });

  elements.shuffleAll.addEventListener('click', () => {
    shufflePlaylist(state.songs);
  });

  elements.progressBar.addEventListener('input', (event) => {
    if (!Number.isFinite(state.audio.duration) || state.audio.duration <= 0) return;
    state.audio.currentTime = (Number(event.target.value) / 100) * state.audio.duration;
    updateProgressUI();
  });

  elements.volumeControl.addEventListener('input', (event) => {
    state.audio.volume = Number(event.target.value);
  });

  state.audio.addEventListener('timeupdate', updateProgressUI);
  state.audio.addEventListener('loadedmetadata', updateProgressUI);
  state.audio.addEventListener('ended', nextTrack);
  state.audio.addEventListener('play', () => {
    elements.playButton.textContent = '❚❚';
  });
  state.audio.addEventListener('pause', () => {
    elements.playButton.textContent = '▶';
  });
}

async function init() {
  const response = await fetch('data.json');
  const payload = await response.json();
  state.artists = payload.artists;
  state.songs = payload.songs;

  state.audio.volume = 1;
  elements.volumeControl.value = '1';
  renderHome();
  bindEvents();

  if (window.location.hash.startsWith('#artist/')) {
    const id = window.location.hash.replace('#artist/', '');
    if (findArtistById(id)) showArtist(id);
  } else {
    setPageView('home');
  }
}

init();

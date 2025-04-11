// API Keys (replace with your own valid keys)
const YOUTUBE_API_KEY = 'AIzaSyBuH6B-KaAn8ljVkxPU38THG3GKI20r_Wg';
// const GEMINI_API_KEY = 'AIzaSyC5Xf_E68UNtWuHHEaI22h6eKaDFbGUvhM';

// Global state
let selectedVideos = [];
let chatHistory = [
    { role: "model", parts: [{ text: "Hello! I'm your music mashup assistant. How can I help you today?" }] }
];
let isMashupPlaying = false;
let progressInterval = null;

// DOM Elements
const elements = {
    searchQuery: document.getElementById('search-query'),
    searchButton: document.getElementById('search-button'),
    searchResults: document.getElementById('search-results'),
    selectedSongs: document.getElementById('selected-songs'),
    mashupName: document.getElementById('mashup-name'),
    createMashupBtn: document.getElementById('create-mashup'),
    suggestMashupBtn: document.getElementById('suggest-mashup'),
    clearSelectionBtn: document.getElementById('clear-selection'),
    userMessage: document.getElementById('user-message'),
    sendMessageBtn: document.getElementById('send-message'),
    chatMessages: document.getElementById('chat-messages'),
    mashupPreview: document.getElementById('mashup-preview'),
    previewTitle: document.getElementById('preview-title'),
    previewSongs: document.getElementById('preview-songs'),
    mashupProgress: document.getElementById('mashup-progress'),
    playMashupBtn: document.getElementById('play-mashup'),
    pauseMashupBtn: document.getElementById('pause-mashup'),
    stopMashupBtn: document.getElementById('stop-mashup'),
    downloadMashupBtn: document.getElementById('download-mashup')
};

// Event Listeners
elements.searchButton.addEventListener('click', searchYouTube);
elements.searchQuery.addEventListener('keypress', (e) => e.key === 'Enter' && searchYouTube());
elements.createMashupBtn.addEventListener('click', createMashup);
elements.suggestMashupBtn.addEventListener('click', suggestMashup);
elements.clearSelectionBtn.addEventListener('click', clearSelection);
elements.sendMessageBtn.addEventListener('click', sendMessage);
elements.userMessage.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
elements.playMashupBtn.addEventListener('click', playMashup);
elements.pauseMashupBtn.addEventListener('click', pauseMashup);
elements.stopMashupBtn.addEventListener('click', stopMashup);
elements.downloadMashupBtn.addEventListener('click', downloadMashup);

// Initialize YouTube API
function initializeYouTubeAPI() {
    gapi.load('client', () => {
        gapi.client.init({
            apiKey: YOUTUBE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest']
        }).then(() => {
            console.log('YouTube API initialized');
        }).catch((err) => {
            console.error('Failed to initialize YouTube API:', err);
            addChatMessage('assistant', 'Error loading YouTube API. Some features may not work.');
        });
    });
}

// Search YouTube for songs
async function searchYouTube() {
    const query = elements.searchQuery.value.trim();
    if (!query) return;

    elements.searchResults.innerHTML = '<div class="flex justify-center py-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>';

    try {
        const response = await gapi.client.youtube.search.list({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: 10,
            videoCategoryId: '10' // Music category
        });
        displaySearchResults(response.result.items);
    } catch (err) {
        console.error('YouTube search failed:', err);
        elements.searchResults.innerHTML = '<p class="text-red-500 text-center py-4">Error searching videos. Try again later.</p>';
    }
}

// Display search results
function displaySearchResults(videos) {
    elements.searchResults.innerHTML = '';
    if (!videos || !videos.length) {
        elements.searchResults.innerHTML = '<p class="text-gray-500 text-center py-10">No results found.</p>';
        return;
    }

    videos.forEach((video) => {
        const { videoId } = video.id;
        const { title, thumbnails, channelTitle: channel } = video.snippet;
        const thumbnail = thumbnails.medium.url;
        const isSelected = selectedVideos.some((v) => v.id === videoId);

        const videoElement = document.createElement('div');
        videoElement.className = `video-thumbnail p-3 border rounded-lg cursor-pointer flex items-center ${isSelected ? 'bg-blue-50' : 'bg-white'}`;
        videoElement.innerHTML = `
            <img src="${thumbnail}" alt="${title}" class="w-16 h-16 rounded-md object-cover mr-3">
            <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium truncate">${title}</h3>
                <p class="text-xs text-gray-500 truncate">${channel}</p>
                <button class="mt-1 text-xs ${isSelected ? 'text-red-500' : 'text-blue-500'} hover:underline">
                    ${isSelected ? 'Remove' : 'Add to mashup'}
                </button>
            </div>
        `;

        videoElement.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleVideoSelection(videoId, title, thumbnail, channel);
        });
        videoElement.addEventListener('click', () => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank'));

        elements.searchResults.appendChild(videoElement);
    });
}

// Toggle video selection
function toggleVideoSelection(id, title, thumbnail, channel) {
    const index = selectedVideos.findIndex((v) => v.id === id);
    if (index === -1) {
        selectedVideos.push({ id, title, thumbnail, channel });
    } else {
        selectedVideos.splice(index, 1);
    }
    updateSelectedSongs();
    searchYouTube(); // Refresh search results to reflect selection
}

// Update selected songs list
function updateSelectedSongs() {
    elements.selectedSongs.innerHTML = '';
    if (!selectedVideos.length) {
        elements.selectedSongs.innerHTML = '<p class="text-gray-500 text-center py-10">No songs selected yet.</p>';
        return;
    }

    selectedVideos.forEach((video, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'flex items-center p-2 border rounded-lg bg-white';
        songElement.innerHTML = `
            <span class="text-xs text-gray-500 mr-2">${index + 1}.</span>
            <img src="${video.thumbnail}" alt="${video.title}" class="w-10 h-10 rounded-md object-cover mr-2">
            <div class="flex-1 min-w-0">
                <h3 class="text-sm truncate">${video.title}</h3>
                <p class="text-xs text-gray-500 truncate">${video.channel}</p>
            </div>
            <button class="text-red-500 hover:text-red-700 p-1">
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        songElement.querySelector('button').addEventListener('click', () => {
            selectedVideos.splice(index, 1);
            updateSelectedSongs();
            searchYouTube();
        });
        elements.selectedSongs.appendChild(songElement);
    });
}

// Simulate mashup creation
function createMashup() {
    if (selectedVideos.length < 2) {
        addChatMessage('assistant', 'Select at least 2 songs to create a mashup.');
        return;
    }

    const name = elements.mashupName.value.trim() || `Mashup_${Math.floor(Math.random() * 1000)}`;
    elements.createMashupBtn.disabled = true;
    elements.createMashupBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...';

    setTimeout(() => {
        elements.previewTitle.textContent = name;
        elements.previewSongs.textContent = `Songs: ${selectedVideos.length}`;
        elements.mashupPreview.classList.remove('hidden');
        elements.createMashupBtn.disabled = false;
        elements.createMashupBtn.innerHTML = '<svg class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>Create Mashup';
        addChatMessage('assistant', `Mashup "${name}" created with ${selectedVideos.length} songs! Play or download it below.`);
        elements.mashupPreview.scrollIntoView({ behavior: 'smooth' });
    }, 2000);
}

// Suggest mashup using Gemini API
async function suggestMashup() {
    if (!selectedVideos.length) {
        addChatMessage('assistant', 'Please select some songs first.');
        return;
    }

    const songList = selectedVideos.map((v) => v.title).join(', ');
    elements.suggestMashupBtn.disabled = true;
    elements.suggestMashupBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Thinking...';

    try {
        const prompt = `Suggest a creative mashup for these songs: ${songList}. Include:
1. A creative name
2. Song order
3. Transitions/effects
4. Mood/theme
Format your response with these sections.`;
        const suggestion = await callGeminiAPI(prompt);
        addChatMessage('assistant', suggestion);
    } catch (err) {
        console.error('Mashup suggestion failed:', err);
        addChatMessage('assistant', `Failed to suggest mashup: ${err.message}`);
    } finally {
        elements.suggestMashupBtn.disabled = false;
        elements.suggestMashupBtn.innerHTML = '<svg class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" /></svg>Suggest Mashup';
    }
}

// Clear selected songs
function clearSelection() {
    selectedVideos = [];
    updateSelectedSongs();
    searchYouTube();
    addChatMessage('assistant', 'Selection cleared. Start fresh!');
}

// Call Gemini API
async function callGeminiAPI(prompt) {
    chatHistory.push({ role: 'user', parts: [{ text: prompt }] });

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`,
            { contents: chatHistory },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const text = response.data.candidates[0].content.parts[0].text;
        chatHistory.push({ role: 'model', parts: [{ text }] });
        return text;
    } catch (err) {
        console.error('Gemini API error:', err.message, err.response?.data || err);
        const errorMsg = err.response?.data?.error?.message || 'Unknown error';
        throw new Error(errorMsg);
    }
}

// Send chat message
async function sendMessage() {
    const message = elements.userMessage.value.trim();
    if (!message) return;

    addChatMessage('user', message);
    elements.userMessage.value = '';

    const typing = document.createElement('div');
    typing.className = 'flex items-center py-2';
    typing.innerHTML = '<div class="flex space-x-1"><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div></div>';
    elements.chatMessages.appendChild(typing);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    try {
        const response = await callGeminiAPI(message);
        elements.chatMessages.removeChild(typing);
        addChatMessage('assistant', response);
    } catch (err) {
        elements.chatMessages.removeChild(typing);
        addChatMessage('assistant', `Error: ${err.message}`);
    }
}

// Add message to chat
function addChatMessage(role, message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' ? 'bg-blue-600 text-white p-3 rounded-lg max-w-xs ml-auto' : 'bg-blue-100 p-3 rounded-lg max-w-xs';
    msgDiv.innerHTML = `<p class="text-sm">${message.replace(/\n/g, '<br>')}</p>`;
    elements.chatMessages.appendChild(msgDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Play mashup (simulated)
function playMashup() {
    if (isMashupPlaying) return;

    isMashupPlaying = true;
    elements.playMashupBtn.classList.add('hidden');
    elements.pauseMashupBtn.classList.remove('hidden');
    let progress = 0;
    elements.mashupProgress.style.width = '0%';

    progressInterval = setInterval(() => {
        progress += 0.5;
        elements.mashupProgress.style.width = `${progress}%`;
        if (progress >= 100) stopMashup();
    }, 100);
}

// Pause mashup
function pauseMashup() {
    if (!isMashupPlaying) return;

    isMashupPlaying = false;
    elements.pauseMashupBtn.classList.add('hidden');
    elements.playMashupBtn.classList.remove('hidden');
    clearInterval(progressInterval);
}

// Stop mashup
function stopMashup() {
    isMashupPlaying = false;
    elements.pauseMashupBtn.classList.add('hidden');
    elements.playMashupBtn.classList.remove('hidden');
    clearInterval(progressInterval);
    elements.mashupProgress.style.width = '0%';
}

// Download mashup (simulated)
function downloadMashup() {
    const name = elements.mashupName.value.trim() || 'my_mashup';
    addChatMessage('assistant', 'Download started (simulated).');
    const a = document.createElement('a');
    a.href = 'data:application/octet-stream,';
    a.download = `${name.replace(/\s+/g, '_')}.mp3`;
    a.click();
}

// Initialize app
window.onload = () => {
    initializeYouTubeAPI();
    setTimeout(() => addChatMessage('assistant', 'Search for songs and create a mashup!'), 1000);
};
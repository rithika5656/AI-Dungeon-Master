// =====================================
// GAME STATE
// =====================================

let gameState = {
    apiKey: null,
    character: {
        name: '',
        race: '',
        class: '',
        backstory: '',
        setting: '',
        level: 1,
        health: 100,
        mana: 100
    },
    conversationHistory: [],
    memory: {
        characters: [],
        locations: [],
        events: []
    },
    turnCount: 0
};

// =====================================
// API KEY MANAGEMENT
// =====================================

function checkApiKey() {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
        gameState.apiKey = savedKey;
        document.getElementById('apiModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
    }
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey || !apiKey.startsWith('sk-')) {
        alert('Please enter a valid OpenAI API key (starts with sk-)');
        return;
    }

    localStorage.setItem('openai_api_key', apiKey);
    gameState.apiKey = apiKey;

    document.getElementById('apiModal').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
}

function showSettings() {
    const newKey = prompt('Enter new OpenAI API Key:', gameState.apiKey || '');
    if (newKey && newKey.trim()) {
        localStorage.setItem('openai_api_key', newKey.trim());
        gameState.apiKey = newKey.trim();
        alert('API Key updated successfully!');
    }
}

// =====================================
// CHARACTER CREATION
// =====================================

let selectedOptions = {
    race: null,
    class: null,
    setting: null
};

function selectRace(race) {
    selectedOptions.race = race;
    updateSelection('race', race);
}

function selectClass(className) {
    selectedOptions.class = className;
    updateSelection('class', className);
}

function selectSetting(setting) {
    const settingNames = {
        'classic': 'a classic high fantasy world with ancient kingdoms, powerful wizards, fearsome dragons, and epic quests',
        'dark': 'a dark gothic fantasy realm plagued by ancient evils, cursed lands, and eldritch horrors',
        'scifi': 'a unique world where advanced technology and ancient magic coexist',
        'pirate': 'the golden age of piracy with treacherous seas, hidden treasures, and rival pirates'
    };
    selectedOptions.setting = settingNames[setting];
    updateSelection('setting', setting);
}

function updateSelection(type, value) {
    document.querySelectorAll(`.option-card`).forEach(card => {
        if (card.textContent.toLowerCase().includes(value.toLowerCase())) {
            card.classList.add('selected');
        } else if (card.classList.contains('selected') &&
            card.textContent.toLowerCase().includes(type)) {
            card.classList.remove('selected');
        }
    });
}

async function startAdventure() {
    const name = document.getElementById('charName').value.trim();
    const backstory = document.getElementById('charBackstory').value.trim() ||
        'A wandering adventurer seeking fortune and glory';

    if (!name) {
        alert('Please enter your character name!');
        return;
    }

    if (!selectedOptions.race || !selectedOptions.class || !selectedOptions.setting) {
        alert('Please select race, class, and setting!');
        return;
    }

    // Save character
    gameState.character = {
        name: name,
        race: selectedOptions.race,
        class: selectedOptions.class,
        backstory: backstory,
        setting: selectedOptions.setting,
        level: 1,
        health: 100,
        mana: 100
    };

    // Update display
    document.getElementById('displayName').textContent = name;
    document.getElementById('displayRace').textContent = selectedOptions.race;
    document.getElementById('displayClass').textContent = selectedOptions.class;

    // Switch screens
    document.getElementById('characterCreation').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    // Generate opening story
    await generateOpeningStory();
}

// =====================================
// AI INTEGRATION
// =====================================

async function callOpenAI(messages, temperature = 0.8) {
    if (!gameState.apiKey) {
        alert('API key not configured!');
        return null;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: temperature,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        alert(`Error: ${error.message}\n\nPlease check your API key in settings.`);
        return null;
    }
}

// =====================================
// STORY GENERATION
// =====================================

async function generateOpeningStory() {
    showLoading(true);

    const systemPrompt = {
        role: 'system',
        content: `You are an expert Dungeon Master running an immersive RPG adventure. Your role is to:
- Create vivid, engaging narratives with rich descriptions
- Present meaningful choices and consequences
- Maintain consistency with character abilities and backstory
- Balance challenge with fun
- End each response with a situation that prompts player action
- Keep responses focused and around 200-300 words

Be creative, dramatic, and engaging. Make the player feel like the hero of an epic tale.`
    };

    const characterSummary = `Character: ${gameState.character.name}, a ${gameState.character.race} ${gameState.character.class}
Backstory: ${gameState.character.backstory}
Setting: ${gameState.character.setting}`;

    const openingPrompt = {
        role: 'user',
        content: `Begin an exciting adventure for this character:\n\n${characterSummary}\n\nCreate an engaging opening scene that introduces the setting, presents an initial situation or mystery, and ends with choices for the player. Make it dramatic and immersive!`
    };

    const response = await callOpenAI([systemPrompt, openingPrompt]);

    if (response) {
        gameState.conversationHistory = [systemPrompt, openingPrompt, {
            role: 'assistant',
            content: response
        }];

        addStoryMessage('Dungeon Master', response, false);
        gameState.turnCount = 0;
    }

    showLoading(false);
}

async function submitAction() {
    const actionInput = document.getElementById('actionInput');
    const action = actionInput.value.trim();

    if (!action) {
        return;
    }

    // Display player action
    addStoryMessage('You', action, true);
    actionInput.value = '';

    // Disable input while generating
    actionInput.disabled = true;
    showLoading(true);

    gameState.turnCount++;

    // Build context
    const characterContext = `Character: ${gameState.character.name} (${gameState.character.race} ${gameState.character.class})
Level: ${gameState.character.level}
Current Turn: ${gameState.turnCount}`;

    const actionPrompt = {
        role: 'user',
        content: `${characterContext}\n\nPlayer Action: ${action}\n\nContinue the story based on this action. Remember to:\n- Describe the consequences of their action\n- Maintain consistency with previous events\n- Present new challenges or choices\n- Keep the narrative engaging and dynamic\n- Use vivid, descriptive language`
    };

    // Keep conversation history manageable (last 10 exchanges)
    const recentHistory = gameState.conversationHistory.length > 20
        ? [gameState.conversationHistory[0], ...gameState.conversationHistory.slice(-18)]
        : gameState.conversationHistory;

    const messages = [...recentHistory, actionPrompt];

    const response = await callOpenAI(messages);

    if (response) {
        gameState.conversationHistory.push(actionPrompt, {
            role: 'assistant',
            content: response
        });

        addStoryMessage('Dungeon Master', response, false);
    }

    actionInput.disabled = false;
    actionInput.focus();
    showLoading(false);
}

// =====================================
// UI FUNCTIONS
// =====================================

function addStoryMessage(sender, text, isPlayer) {
    const storyContent = document.getElementById('storyContent');

    const messageDiv = document.createElement('div');
    messageDiv.className = `story-message ${isPlayer ? 'player' : 'dm'}`;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'message-label';
    labelDiv.textContent = sender;

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = formatText(text);

    messageDiv.appendChild(labelDiv);
    messageDiv.appendChild(textDiv);
    storyContent.appendChild(messageDiv);

    // Scroll to bottom
    storyContent.scrollTop = storyContent.scrollHeight;
}

function formatText(text) {
    // Convert markdown-style formatting to HTML
    let formatted = text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

    return formatted;
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showStatus() {
    const char = gameState.character;
    const statusMessage = `
<strong>Character Status</strong>

<strong>Name:</strong> ${char.name}
<strong>Race:</strong> ${char.race}
<strong>Class:</strong> ${char.class}
<strong>Level:</strong> ${char.level}
<strong>Health:</strong> ${char.health}/100
<strong>Mana:</strong> ${char.mana}/100

<strong>Turn:</strong> ${gameState.turnCount}

<em>${char.backstory}</em>
    `;

    alert(statusMessage.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''));
}

function newGame() {
    if (confirm('Are you sure you want to start a new adventure? Your current progress will be lost.')) {
        // Reset state
        gameState.character = {
            name: '',
            race: '',
            class: '',
            backstory: '',
            setting: '',
            level: 1,
            health: 100,
            mana: 100
        };
        gameState.conversationHistory = [];
        gameState.turnCount = 0;
        selectedOptions = { race: null, class: null, setting: null };

        // Clear UI
        document.getElementById('charName').value = '';
        document.getElementById('charBackstory').value = '';
        document.getElementById('storyContent').innerHTML = '';
        document.querySelectorAll('.option-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Switch screens
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('characterCreation').classList.add('active');
    }
}

// =====================================
// KEYBOARD SHORTCUTS
// =====================================

document.addEventListener('keydown', (e) => {
    const actionInput = document.getElementById('actionInput');

    // Enter to submit (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey && document.activeElement === actionInput) {
        e.preventDefault();
        submitAction();
    }
});

// =====================================
// EASTER EGGS & POLISH
// =====================================

function addEasterEggs() {
    const actionInput = document.getElementById('actionInput');

    actionInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();

        // Add subtle effects for dramatic actions
        if (value.includes('attack') || value.includes('fight') || value.includes('battle')) {
            actionInput.style.borderColor = '#dc2626';
        } else if (value.includes('cast') || value.includes('spell') || value.includes('magic')) {
            actionInput.style.borderColor = '#9f7aea';
        } else if (value.includes('sneak') || value.includes('hide') || value.includes('steal')) {
            actionInput.style.borderColor = '#10b981';
        } else {
            actionInput.style.borderColor = 'var(--border-color)';
        }
    });
}

// =====================================
// TIPS SYSTEM
// =====================================

const gameTips = [
    "💡 Tip: Be specific with your actions for better responses!",
    "💡 Tip: Try talking to NPCs to uncover story secrets.",
    "💡 Tip: Use 'examine' or 'look around' to get more details.",
    "💡 Tip: Your character's class affects how the story unfolds!",
    "💡 Tip: The AI remembers your previous actions - consistency matters!",
    "💡 Tip: Try creative solutions - this is your adventure!",
    "💡 Tip: Press Enter to send your action, Shift+Enter for new line."
];

function showRandomTip() {
    const randomTip = gameTips[Math.floor(Math.random() * gameTips.length)];
    console.log(`%c${randomTip}`, 'color: #d4af37; font-size: 14px; font-weight: bold;');
}

// =====================================
// LOCAL STORAGE & SAVE SYSTEM
// =====================================

function saveGameState() {
    try {
        localStorage.setItem('game_state', JSON.stringify(gameState));
        localStorage.setItem('selected_options', JSON.stringify(selectedOptions));
    } catch (error) {
        console.error('Failed to save game state:', error);
    }
}

function loadGameState() {
    try {
        const savedState = localStorage.getItem('game_state');
        const savedOptions = localStorage.getItem('selected_options');

        if (savedState) {
            const state = JSON.parse(savedState);
            // Only load if there's actual game progress
            if (state.turnCount > 0) {
                if (confirm('Continue your previous adventure?')) {
                    gameState = state;
                    selectedOptions = savedOptions ? JSON.parse(savedOptions) : selectedOptions;

                    // Restore UI
                    document.getElementById('characterCreation').classList.remove('active');
                    document.getElementById('gameScreen').classList.add('active');

                    // Update character display
                    document.getElementById('displayName').textContent = gameState.character.name;
                    document.getElementById('displayRace').textContent = gameState.character.race;
                    document.getElementById('displayClass').textContent = gameState.character.class;

                    // Restore conversation
                    gameState.conversationHistory.slice(2).forEach(msg => {
                        if (msg.role === 'user') {
                            addStoryMessage('You', msg.content, true);
                        } else if (msg.role === 'assistant') {
                            addStoryMessage('Dungeon Master', msg.content, false);
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Failed to load game state:', error);
    }
}

// Auto-save every 30 seconds
setInterval(() => {
    if (gameState.turnCount > 0) {
        saveGameState();
    }
}, 30000);

// Save before leaving
window.addEventListener('beforeunload', () => {
    if (gameState.turnCount > 0) {
        saveGameState();
    }
});

// =====================================
// INITIALIZATION
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🐉 AI Dungeon Master 🐉',
        'background: linear-gradient(135deg, #d4af37, #b8931f); color: #0f0f1a; font-size: 24px; padding: 10px; border-radius: 5px; font-weight: bold;');
    console.log('%cYour adventure awaits...', 'color: #d4af37; font-size: 16px; font-style: italic;');

    checkApiKey();
    addEasterEggs();
    loadGameState();
    showRandomTip();

    // Show tip every 5 minutes
    setInterval(showRandomTip, 300000);
});

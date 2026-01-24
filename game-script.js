// =====================================
// GAME STATE
// =====================================

let gameState = {
    apiKey: null,
    demoMode: true,  // DEFAULT: Start in demo mode
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
    if (savedKey && savedKey.startsWith('sk-')) {
        gameState.apiKey = savedKey;
        gameState.demoMode = false;
    }
    // ALWAYS show game - no modal blocking!
    document.getElementById('apiModal').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey || !apiKey.startsWith('sk-')) {
        alert('Please enter a valid OpenAI API key (starts with sk-)');
        return;
    }

    localStorage.setItem('openai_api_key', apiKey);
    gameState.apiKey = apiKey;
    gameState.demoMode = false;

    document.getElementById('apiModal').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    alert('✅ Real AI mode activated! Restart your adventure to use GPT.');
}

function showSettings() {
    const currentMode = gameState.demoMode ? '🎭 Demo Mode (Simulated)' : '🤖 Real AI Mode (GPT)';
    const message = `Current: ${currentMode}\n\nOptions:\n1. Enter API key for real AI\n2. Leave empty to stay in demo mode\n3. Enter "demo" to switch to demo mode`;

    const newKey = prompt(message, gameState.apiKey || '');

    if (newKey === null) return; // Cancelled

    if (newKey.trim() === 'demo' || newKey.trim() === '') {
        gameState.demoMode = true;
        gameState.apiKey = null;
        localStorage.removeItem('openai_api_key');
        alert('✅ Switched to Demo Mode!');
    } else if (newKey.startsWith('sk-')) {
        localStorage.setItem('openai_api_key', newKey.trim());
        gameState.apiKey = newKey.trim();
        gameState.demoMode = false;
        alert('✅ Switched to Real AI Mode!');
    } else {
        alert('Invalid API key format. Should start with "sk-"');
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
    selectedOptions.settingKey = setting;
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
// DEMO MODE RESPONSES
// =====================================

function getDemoResponse(action, isOpening = false) {
    const char = gameState.character;

    if (isOpening) {
        const openings = {
            classic: `The morning sun breaks over the mountains as you, **${char.name}**, awaken in the village of Millhaven. As a ${char.race} ${char.class}, you've traveled far seeking adventure.

The village elder rushes toward you, face pale with worry. "Thank the gods you're here! Strange creatures have been spotted near the old ruins to the north. The guard captain needs someone brave enough to investigate."

You notice three paths before you:
1. Head directly to the ruins
2. Visit the local tavern for information
3. Speak with the guard captain first

What do you do?`,
            dark: `Blood-red moonlight filters through twisted trees as you, **${char.name}**, emerge from the cursed forest. Your ${char.race} heritage and ${char.class} training have prepared you for darkness, but nothing could prepare you for this...

A village lies ahead, but something is wrong. No lights. No sounds. Just eerie silence and the smell of decay.

A desperate note nailed to a tree reads: "They came at midnight. The darkness took them all. Only the bell tower remains safe. - M"

Your choices:
1. Search the silent houses
2. Head straight to the bell tower  
3. Investigate the town square

What will you do?`,
            scifi: `Warning klaxons blare as your ship, the *Starfire*, drops out of hyperspace. Captain ${char.name}, ${char.race} ${char.class}, you've arrived at Station Epsilon-7.

But something's wrong. The station is dark, drifting. Your scanners detect life signs, but they're... erratic. Unstable.

Your AI companion, ARIA, reports: "Captain, I'm detecting an unknown energy signature. It's similar to the ancient artifacts we've been tracking. Also... there's a distress beacon, but it's broadcasting in an extinct language."

Your options:
1. Dock and board the station
2. Scan for more data first
3. Respond to the distress beacon

Your command?`,
            pirate: `The Caribbean sun beats down as you, **${char.name}**, ${char.race} ${char.class}, stand at the helm of your ship. The crew whispers about the treasure map you acquired last night—supposedly leading to the legendary Dead Man's Gold.

Your first mate approaches: "Captain! Spanish galleon spotted off starboard. She's heavy in the water—loaded with cargo. But there's also word that Governor Martinez is in port, offering amnesty and a commission to any pirate who surrenders."

Three paths lie before you:
1. Attack the Spanish galleon
2. Follow the treasure map
3. Meet with the Governor

What be your orders, Captain?`
        };

        return openings[selectedOptions.settingKey] || openings.classic;
    }

    // Generate contextual responses based on action
    const actionLower = action.toLowerCase();

    if (actionLower.includes('attack') || actionLower.includes('fight')) {
        return `You steel yourself and charge forward! Your ${char.class} training kicks in as you engage the threat.

*The battle is fierce!* Your opponent counters with surprising speed, but your determination gives you the edge. After a intense struggle, victory is yours!

As the dust settles, you notice a **mysterious glowing artifact** among the debris. You also spot a **hidden passageway** that wasn't visible before.

What do you do next?`;
    }

    if (actionLower.includes('examine') || actionLower.includes('look') || actionLower.includes('search')) {
        return `You carefully examine your surroundings with the keen eye of a ${char.class}.

You discover:
• **Ancient markings** on the wall telling a forgotten story
• **A hidden compartment** containing a **glowing crystal**
• **Fresh tracks** leading deeper into the unknown
• **Faint whispers** echoing from somewhere ahead

The crystal pulses with energy, resonating with your ${char.race} heritage. It seems to be pointing you toward something important.

How do you proceed?`;
    }

    if (actionLower.includes('talk') || actionLower.includes('speak') || actionLower.includes('ask')) {
        return `You approach and begin a conversation.

The stranger's eyes widen as they notice your ${char.race} features and ${char.class} equipment.

"${char.name}?" they whisper urgently. "I can't believe my luck finding you here! Listen carefully—there's no time. The Council of Shadows is planning something terrible. They've stolen the **Keystone of Eternity** and plan to use it at midnight."

They press a **sealed letter** into your hand. "This will explain everything. Trust no one from the order. They may already be compromised."

Before you can respond, they vanish into the crowd!

What will you do?`;
    }

    if (actionLower.includes('magic') || actionLower.includes('cast') || actionLower.includes('spell')) {
        return `You channel your mystical energy, calling upon the ancient powers!

**Brilliant light erupts from your hands!** The spell manifests perfectly, enhanced by your ${char.class} abilities. 

The magical energy reveals:
• A **shimmering portal** that wasn't visible before
• **Protective runes** glowing on the ground
• A **spectral figure** materializing nearby
• **Hidden magical traps** now neutralized

The spectral figure bows: "Well done, wielder of magic. You have proven worthy. I offer you a choice: **Knowledge of the past** or **Sight of the future**?"

Which do you choose?`;
    }

    // Default response
    return `Your action has consequences!

As a ${char.race} ${char.class}, you handle the situation with skill. Your decision opens new possibilities:

**A mysterious figure** approaches from the shadows. "Interesting move, ${char.name}. Not many would have done that. You've caught the attention of powerful forces."

They reveal three **sealed scrolls**: 
• **Scroll of Power** - Grants great strength
• **Scroll of Knowledge** - Reveals hidden truths
• **Scroll of Destiny** - Shows possible futures

"Choose wisely," they say before disappearing.

What do you do?`;
}

// =====================================
// AI INTEGRATION
// =====================================

async function callOpenAI(messages, temperature = 0.8) {
    // DEMO MODE: Return simulated response
    if (gameState.demoMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        return null;  // Will trigger demo response
    }

    if (!gameState.apiKey) {
        alert('No API key configured! Switching to demo mode.');
        gameState.demoMode = true;
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
        alert(`Error: ${error.message}\n\nSwitching to demo mode.`);
        gameState.demoMode = true;
        return null;
    }
}

// =====================================
// STORY GENERATION
// =====================================

async function generateOpeningStory() {
    showLoading(true);

    let response;

    if (gameState.demoMode) {
        // Use demo response
        await new Promise(resolve => setTimeout(resolve, 1500));
        response = getDemoResponse('', true);
    } else {
        // Use real AI
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

        response = await callOpenAI([systemPrompt, openingPrompt]);

        if (!response) {
            // Fallback to demo
            response = getDemoResponse('', true);
        } else {
            gameState.conversationHistory = [systemPrompt, openingPrompt, {
                role: 'assistant',
                content: response
            }];
        }
    }

    if (response) {
        const modeIndicator = gameState.demoMode ? ' 🎭' : ' 🤖';
        addStoryMessage('Dungeon Master' + modeIndicator, response, false);
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

    let response;

    if (gameState.demoMode) {
        // Use demo response
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500));
        response = getDemoResponse(action, false);
    } else {
        // Build context for real AI
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

        response = await callOpenAI(messages);

        if (!response) {
            // Fallback to demo
            response = getDemoResponse(action, false);
        } else {
            gameState.conversationHistory.push(actionPrompt, {
                role: 'assistant',
                content: response
            });
        }
    }

    if (response) {
        const modeIndicator = gameState.demoMode ? ' 🎭' : ' 🤖';
        addStoryMessage('Dungeon Master' + modeIndicator, response, false);
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
    const mode = gameState.demoMode ? '🎭 Demo Mode' : '🤖 Real AI';
    const statusMessage = `
<strong>Character Status</strong>

<strong>Name:</strong> ${char.name}
<strong>Race:</strong> ${char.race}
<strong>Class:</strong> ${char.class}
<strong>Level:</strong> ${char.level}
<strong>Health:</strong> ${char.health}/100
<strong>Mana:</strong> ${char.mana}/100

<strong>Turn:</strong> ${gameState.turnCount}
<strong>Mode:</strong> ${mode}

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
    "💡 Tip: Try creative solutions - this is your adventure!",
    "💡 Tip: Press Enter to send, Shift+Enter for new line.",
    "💡 Tip: You're in demo mode! Add API key in settings for real AI."
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
                            const modeIndicator = gameState.demoMode ? ' 🎭' : ' 🤖';
                            addStoryMessage('Dungeon Master' + modeIndicator, msg.content, false);
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
    const mode = gameState.demoMode ? 'Demo Mode' : 'AI Mode';
    console.log('%c🐉 AI Dungeon Master 🐉',
        'background: linear-gradient(135deg, #d4af37, #b8931f); color: #0f0f1a; font-size: 24px; padding: 10px; border-radius: 5px; font-weight: bold;');
    console.log(`%c🎭 Running in ${mode} - Your adventure awaits!`, 'color: #d4af37; font-size: 16px; font-style: italic;');

    checkApiKey();
    addEasterEggs();
    loadGameState();
    showRandomTip();

    // Show tip every 5 minutes
    setInterval(showRandomTip, 300000);
});

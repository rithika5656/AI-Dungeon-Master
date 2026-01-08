# 🐉 AI Dungeon Master

An interactive storytelling adventure game powered by AI. Create your character, choose your setting, and embark on unique adventures where your choices shape the narrative.

## ✨ Features

- **AI-Powered Storytelling**: Uses GPT to generate dynamic, contextual narratives
- **Character Persistence**: Your character's stats, backstory, and progress are maintained throughout the adventure
- **Memory System**: Vector database (ChromaDB) ensures plot consistency by remembering NPCs, locations, and story events
- **Branching Narratives**: Every choice matters and affects the story's direction
- **Multiple Settings**: Choose from fantasy, dark fantasy, sci-fi, pirate adventures, or create your own
- **Rich Terminal UI**: Beautiful text-based interface using Rich library

## 🛠️ Tech Stack

- **LLM**: OpenAI GPT-3.5/4 for storytelling
- **Memory**: ChromaDB vector database for plot consistency
- **Interface**: Rich library for terminal UI
- **Language**: Python 3.8+

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/rithika5656/AI-Dungeon-Master.git
cd AI-Dungeon-Master
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

## 🎮 How to Play

Run the game:
```bash
python game.py
```

### Game Commands
- Type your action to continue the story
- `help` - Show available commands
- `status` - View your character status
- `quit` - Exit the game

### Gameplay Tips
- Be descriptive with your actions
- Interact with NPCs and explore locations
- The AI remembers your choices and maintains story consistency
- Your decisions shape the narrative!

## 🏗️ Project Structure

```
AI-Dungeon-Master/
├── game.py          # Main game interface
├── storyteller.py   # LLM-powered story engine
├── memory.py        # Vector database memory system
├── config.py        # Configuration settings
├── requirements.txt # Python dependencies
├── .env.example     # Environment variables template
└── README.md        # This file
```

## 🔧 Configuration

Edit `config.py` to customize:
- `MODEL_NAME`: Change the OpenAI model (default: gpt-3.5-turbo)
- `NARRATIVE_TEMPERATURE`: Adjust creativity (0.0-1.0)
- `MAX_MEMORY_ITEMS`: Number of memories to retrieve

## 📝 License

MIT License - feel free to use and modify for your own adventures!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new adventure settings
- Improve the memory system
- Enhance the UI
- Fix bugs

## 🎲 Future Enhancements

- [ ] Save/Load game functionality
- [ ] Multiplayer support
- [ ] Image generation for scenes
- [ ] Voice input/output
- [ ] Combat system with dice rolls
- [ ] Inventory management

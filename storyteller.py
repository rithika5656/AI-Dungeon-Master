"""LLM-powered storytelling engine."""

from openai import OpenAI
from typing import Optional, List, Dict
from config import (
    OPENAI_API_KEY, 
    MODEL_NAME, 
    DUNGEON_MASTER_PROMPT,
    CHARACTER_CREATION_PROMPT,
    NARRATIVE_TEMPERATURE
)
from memory import MemoryManager, GameState


class StoryTeller:
    """AI Dungeon Master storytelling engine."""
    
    def __init__(self):
        """Initialize the storyteller with OpenAI client."""
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.memory = MemoryManager()
        self.game_state = GameState()
        self.conversation_history: List[Dict] = []
    
    def _call_llm(self, messages: List[Dict], temperature: float = NARRATIVE_TEMPERATURE) -> str:
        """Make a call to the LLM."""
        try:
            response = self.client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                temperature=temperature,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error communicating with AI: {str(e)}"
    
    def create_character_interactive(self, user_input: str) -> str:
        """Handle character creation conversation."""
        messages = [
            {"role": "system", "content": CHARACTER_CREATION_PROMPT},
            {"role": "user", "content": user_input}
        ]
        return self._call_llm(messages, temperature=0.7)
    
    def set_character(self, name: str, race: str, char_class: str, backstory: str):
        """Set the player's character."""
        self.game_state.set_character(name, race, char_class, backstory)
        
        # Store character in memory
        char_info = f"PLAYER CHARACTER: {name}, a {race} {char_class}. {backstory}"
        self.memory.add_character("player", char_info, {"is_player": True})
    
    def start_adventure(self, setting: Optional[str] = None) -> str:
        """Begin a new adventure."""
        self.game_state.turn_count = 0
        
        setting_prompt = setting or "a mysterious fantasy world"
        character_summary = self.game_state.get_character_summary()
        
        start_prompt = f"""Begin an exciting adventure for this character:
{character_summary}

Setting: {setting_prompt}

Create an engaging opening scene that introduces the setting and presents the character with an initial situation or mystery. End with choices for the player."""

        messages = [
            {"role": "system", "content": DUNGEON_MASTER_PROMPT},
            {"role": "user", "content": start_prompt}
        ]
        
        response = self._call_llm(messages)
        
        # Store the opening in memory
        self.memory.add_story_event(
            f"turn_0",
            f"Adventure begins: {response[:500]}...",
            {"turn": 0, "type": "opening"}
        )
        
        self.conversation_history = messages + [{"role": "assistant", "content": response}]
        
        return response
    
    def process_action(self, player_action: str) -> str:
        """Process a player action and generate the next story segment."""
        self.game_state.turn_count += 1
        turn = self.game_state.turn_count
        
        # Get relevant context from memory
        context = self.memory.get_context_string(player_action)
        character_summary = self.game_state.get_character_summary()
        
        # Build the prompt with context
        action_prompt = f"""GAME CONTEXT:
{context}

PLAYER CHARACTER:
{character_summary}

PLAYER ACTION: {player_action}

Continue the story based on this action. Remember to maintain consistency with all previous events and character details. Create consequences for the player's choice and present new options."""

        # Use conversation history for continuity
        messages = [
            {"role": "system", "content": DUNGEON_MASTER_PROMPT}
        ]
        
        # Add recent conversation history (last 6 exchanges)
        recent_history = self.conversation_history[-12:] if len(self.conversation_history) > 12 else self.conversation_history[1:]
        messages.extend(recent_history)
        messages.append({"role": "user", "content": action_prompt})
        
        response = self._call_llm(messages)
        
        # Store in memory
        event_summary = f"Turn {turn}: Player chose '{player_action[:100]}'. Result: {response[:300]}..."
        self.memory.add_story_event(
            f"turn_{turn}",
            event_summary,
            {"turn": turn, "action": player_action[:100]}
        )
        
        # Update conversation history
        self.conversation_history.append({"role": "user", "content": action_prompt})
        self.conversation_history.append({"role": "assistant", "content": response})
        
        # Keep conversation history manageable
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-16:]
        
        return response
    
    def add_npc(self, name: str, description: str):
        """Add an NPC to the game memory."""
        npc_id = name.lower().replace(" ", "_")
        self.memory.add_character(npc_id, f"NPC - {name}: {description}", {"is_player": False})
    
    def add_location(self, name: str, description: str):
        """Add a location to the game memory."""
        loc_id = name.lower().replace(" ", "_")
        self.memory.add_location(loc_id, f"LOCATION - {name}: {description}")
        self.game_state.current_location = name
    
    def get_story_so_far(self) -> str:
        """Get a summary of the story so far."""
        if not self.game_state.story_summary:
            return "The adventure has just begun..."
        
        return "\n".join(self.game_state.story_summary[-10:])
    
    def new_game(self):
        """Start a completely new game."""
        self.memory.clear_all()
        self.game_state = GameState()
        self.conversation_history = []

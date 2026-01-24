"""Vector database memory system for maintaining narrative consistency."""

import chromadb
import json
from typing import List, Dict, Optional
import os


class MemoryManager:
    """Manages game memory using ChromaDB vector database."""
    
    def __init__(self, persist_directory: str = "./chroma_data"):
        """Initialize the memory manager with ChromaDB."""
        self.persist_directory = persist_directory
        
        # Create ChromaDB client with persistence
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Create collections for different memory types
        self.story_collection = self.client.get_or_create_collection(
            name="story_events",
            metadata={"description": "Story events and narrative moments"}
        )
        
        self.character_collection = self.client.get_or_create_collection(
            name="characters",
            metadata={"description": "Character information and NPCs"}
        )
        
        self.location_collection = self.client.get_or_create_collection(
            name="locations",
            metadata={"description": "Visited locations and their descriptions"}
        )
    
    def add_story_event(self, event_id: str, event_text: str, metadata: Optional[Dict] = None):
        """Add a story event to memory."""
        meta = metadata or {}
        meta["type"] = "story_event"
        
        self.story_collection.add(
            ids=[event_id],
            documents=[event_text],
            metadatas=[meta]
        )
    
    def add_character(self, char_id: str, char_info: str, metadata: Optional[Dict] = None):
        """Add or update character information."""
        meta = metadata or {}
        meta["type"] = "character"
        
        # Try to update existing, otherwise add new
        try:
            self.character_collection.update(
                ids=[char_id],
                documents=[char_info],
                metadatas=[meta]
            )
        except:
            self.character_collection.add(
                ids=[char_id],
                documents=[char_info],
                metadatas=[meta]
            )
    
    def add_location(self, loc_id: str, loc_description: str, metadata: Optional[Dict] = None):
        """Add a location to memory."""
        meta = metadata or {}
        meta["type"] = "location"
        
        try:
            self.location_collection.update(
                ids=[loc_id],
                documents=[loc_description],
                metadatas=[meta]
            )
        except:
            self.location_collection.add(
                ids=[loc_id],
                documents=[loc_description],
                metadatas=[meta]
            )
    
    def search_relevant_memories(self, query: str, n_results: int = 5) -> Dict[str, List[str]]:
        """Search all collections for relevant memories."""
        results = {
            "story": [],
            "characters": [],
            "locations": []
        }
        
        # Search story events
        if self.story_collection.count() > 0:
            story_results = self.story_collection.query(
                query_texts=[query],
                n_results=min(n_results, self.story_collection.count())
            )
            results["story"] = story_results["documents"][0] if story_results["documents"] else []
        
        # Search characters
        if self.character_collection.count() > 0:
            char_results = self.character_collection.query(
                query_texts=[query],
                n_results=min(n_results, self.character_collection.count())
            )
            results["characters"] = char_results["documents"][0] if char_results["documents"] else []
        
        # Search locations
        if self.location_collection.count() > 0:
            loc_results = self.location_collection.query(
                query_texts=[query],
                n_results=min(n_results, self.location_collection.count())
            )
            results["locations"] = loc_results["documents"][0] if loc_results["documents"] else []
        
        return results
    
    def get_context_string(self, query: str) -> str:
        """Get a formatted context string for the LLM."""
        memories = self.search_relevant_memories(query)
        
        context_parts = []
        
        if memories["characters"]:
            context_parts.append("KNOWN CHARACTERS:\n" + "\n".join(memories["characters"]))
        
        if memories["locations"]:
            context_parts.append("KNOWN LOCATIONS:\n" + "\n".join(memories["locations"]))
        
        if memories["story"]:
            context_parts.append("RECENT EVENTS:\n" + "\n".join(memories["story"]))
        
        return "\n\n".join(context_parts) if context_parts else "No previous context available."
    
    def clear_all(self):
        """Clear all memories (for new game)."""
        self.client.delete_collection("story_events")
        self.client.delete_collection("characters")
        self.client.delete_collection("locations")
        
        # Recreate collections
        self.story_collection = self.client.get_or_create_collection(name="story_events")
        self.character_collection = self.client.get_or_create_collection(name="characters")
        self.location_collection = self.client.get_or_create_collection(name="locations")


class GameState:
    """Manages the current game state."""
    
    def __init__(self):
        self.player_character = {}
        self.current_location = "Unknown"
        self.turn_count = 0
        self.story_summary = []
        self.active_quests = []
    
    def set_character(self, name: str, race: str, char_class: str, backstory: str):
        """Set player character details."""
        self.player_character = {
            "name": name,
            "race": race,
            "class": char_class,
            "backstory": backstory,
            "inventory": [],
            "health": 100,
            "level": 1
        }
    
    def get_character_summary(self) -> str:
        """Get a summary of the player character."""
        if not self.player_character:
            return "No character created yet."
        
        pc = self.player_character
        return f"{pc['name']} - {pc['race']} {pc['class']}\nBackstory: {pc['backstory']}"
    
    def add_to_story(self, event: str):
        """Add an event to the story summary."""
        self.story_summary.append(event)
        # Keep only last 20 events in active memory
        if len(self.story_summary) > 20:
            self.story_summary = self.story_summary[-20:]
    
    def to_dict(self) -> Dict:
        """Convert state to dictionary for saving."""
        return {
            "player_character": self.player_character,
            "current_location": self.current_location,
            "turn_count": self.turn_count,
            "story_summary": self.story_summary,
            "active_quests": self.active_quests
        }
    
    def from_dict(self, data: Dict):
        """Load state from dictionary."""
        self.player_character = data.get("player_character", {})
        self.current_location = data.get("current_location", "Unknown")
        self.turn_count = data.get("turn_count", 0)
        self.story_summary = data.get("story_summary", [])
        self.active_quests = data.get("active_quests", [])

"""Main game interface for AI Dungeon Master."""

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.markdown import Markdown
from rich.text import Text
from storyteller import StoryTeller
import sys


console = Console()


def print_header():
    """Print the game header."""
    header = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                    🐉 AI DUNGEON MASTER 🐉                    ║
    ║           Interactive Storytelling Adventure Game            ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    console.print(header, style="bold magenta")


def print_story(text: str):
    """Print story text in a nice panel."""
    console.print(Panel(Markdown(text), border_style="green", padding=(1, 2)))


def print_system(text: str):
    """Print system messages."""
    console.print(f"\n[bold cyan]⚔️  {text}[/bold cyan]\n")


def get_player_input(prompt: str = "What do you do?") -> str:
    """Get input from the player."""
    console.print()
    return Prompt.ask(f"[bold yellow]🎮 {prompt}[/bold yellow]")


def character_creation(storyteller: StoryTeller) -> bool:
    """Handle character creation process."""
    print_system("CHARACTER CREATION")
    
    console.print("[dim]Create your hero for this adventure![/dim]\n")
    
    name = Prompt.ask("[bold]Enter your character's name[/bold]")
    if not name:
        name = "Adventurer"
    
    console.print("\n[dim]Choose a race:[/dim]")
    console.print("  1. Human - Versatile and adaptable")
    console.print("  2. Elf - Graceful and magical")
    console.print("  3. Dwarf - Sturdy and resilient")
    console.print("  4. Halfling - Lucky and nimble")
    console.print("  5. Other (specify)")
    
    race_choice = Prompt.ask("Select race", choices=["1", "2", "3", "4", "5"], default="1")
    races = {"1": "Human", "2": "Elf", "3": "Dwarf", "4": "Halfling"}
    race = races.get(race_choice) or Prompt.ask("Enter custom race")
    
    console.print("\n[dim]Choose a class:[/dim]")
    console.print("  1. Warrior - Master of combat")
    console.print("  2. Mage - Wielder of arcane power")
    console.print("  3. Rogue - Shadow and stealth expert")
    console.print("  4. Cleric - Divine healer and protector")
    console.print("  5. Ranger - Nature's guardian")
    console.print("  6. Other (specify)")
    
    class_choice = Prompt.ask("Select class", choices=["1", "2", "3", "4", "5", "6"], default="1")
    classes = {"1": "Warrior", "2": "Mage", "3": "Rogue", "4": "Cleric", "5": "Ranger"}
    char_class = classes.get(class_choice) or Prompt.ask("Enter custom class")
    
    console.print("\n[dim]Write a brief backstory (or press Enter for random):[/dim]")
    backstory = Prompt.ask("Backstory", default="A wandering adventurer seeking fortune and glory")
    
    # Set the character
    storyteller.set_character(name, race, char_class, backstory)
    
    # Display character summary
    console.print("\n")
    console.print(Panel(
        f"[bold]{name}[/bold]\n"
        f"[cyan]{race} {char_class}[/cyan]\n\n"
        f"[italic]{backstory}[/italic]",
        title="✨ Your Character ✨",
        border_style="yellow"
    ))
    
    return Confirm.ask("\nIs this character correct?", default=True)


def choose_setting() -> str:
    """Let player choose adventure setting."""
    print_system("CHOOSE YOUR ADVENTURE")
    
    console.print("[dim]Select a setting for your adventure:[/dim]\n")
    console.print("  1. 🏰 Classic Fantasy - Kingdoms, dragons, and magic")
    console.print("  2. 🌑 Dark Fantasy - Gothic horror and ancient evils")
    console.print("  3. 🚀 Sci-Fi Fantasy - Magic meets technology")
    console.print("  4. 🏴‍☠️ Pirate Adventure - High seas and treasure")
    console.print("  5. 🎭 Custom Setting - Describe your own")
    
    choice = Prompt.ask("\nSelect setting", choices=["1", "2", "3", "4", "5"], default="1")
    
    settings = {
        "1": "a classic high fantasy world with ancient kingdoms, powerful wizards, fearsome dragons, and epic quests",
        "2": "a dark gothic fantasy realm plagued by ancient evils, cursed lands, and eldritch horrors lurking in the shadows",
        "3": "a unique world where advanced technology and ancient magic coexist, with space-faring vessels and arcane AI",
        "4": "the golden age of piracy, with treacherous seas, hidden treasures, mysterious islands, and rival pirates"
    }
    
    if choice == "5":
        return Prompt.ask("Describe your custom setting")
    
    return settings[choice]


def game_loop(storyteller: StoryTeller):
    """Main game loop."""
    while True:
        try:
            player_input = get_player_input()
            
            # Check for special commands
            if player_input.lower() in ['quit', 'exit', 'q']:
                if Confirm.ask("\n[bold red]Are you sure you want to quit?[/bold red]"):
                    console.print("\n[bold]Thanks for playing AI Dungeon Master![/bold]")
                    console.print("[dim]Your adventure will be remembered...[/dim]\n")
                    break
                continue
            
            if player_input.lower() == 'help':
                show_help()
                continue
            
            if player_input.lower() == 'status':
                show_status(storyteller)
                continue
            
            if not player_input.strip():
                console.print("[dim]Please enter an action or type 'help' for commands.[/dim]")
                continue
            
            # Process the player's action
            console.print("\n[dim italic]The Dungeon Master weaves the tale...[/dim italic]\n")
            
            with console.status("[bold green]Generating story...", spinner="dots"):
                response = storyteller.process_action(player_input)
            
            print_story(response)
            
        except KeyboardInterrupt:
            console.print("\n\n[bold]Game interrupted. Type 'quit' to exit properly.[/bold]")


def show_help():
    """Show help information."""
    help_text = """
**Available Commands:**

- **quit/exit/q** - Exit the game
- **help** - Show this help message
- **status** - View your character status

**Gameplay Tips:**

- Be descriptive with your actions
- You can interact with NPCs, explore locations, or take any action you can imagine
- The AI remembers your choices and maintains story consistency
- Your choices shape the narrative!
    """
    console.print(Panel(Markdown(help_text), title="📖 Help", border_style="blue"))


def show_status(storyteller: StoryTeller):
    """Show current game status."""
    char = storyteller.game_state.player_character
    if char:
        status = f"""
**{char.get('name', 'Unknown')}**
Race: {char.get('race', 'Unknown')}
Class: {char.get('class', 'Unknown')}
Turn: {storyteller.game_state.turn_count}
Location: {storyteller.game_state.current_location}
        """
        console.print(Panel(Markdown(status), title="📊 Status", border_style="cyan"))
    else:
        console.print("[dim]No character created yet.[/dim]")


def main():
    """Main entry point."""
    print_header()
    
    # Check for API key
    from config import OPENAI_API_KEY
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        console.print(Panel(
            "[bold red]OpenAI API key not configured![/bold red]\n\n"
            "Please set your API key in a .env file:\n"
            "[cyan]OPENAI_API_KEY=your_key_here[/cyan]\n\n"
            "Get your API key from: https://platform.openai.com/api-keys",
            title="⚠️ Configuration Required",
            border_style="red"
        ))
        sys.exit(1)
    
    storyteller = StoryTeller()
    
    # Character creation
    print_system("Welcome, Adventurer!")
    console.print("[dim]Prepare to embark on an epic journey where your choices shape the story.[/dim]\n")
    
    while not character_creation(storyteller):
        console.print("[dim]Let's try again...[/dim]\n")
    
    # Choose setting
    setting = choose_setting()
    
    # Start the adventure
    print_system("YOUR ADVENTURE BEGINS")
    
    with console.status("[bold green]The Dungeon Master prepares your adventure...", spinner="dots"):
        opening = storyteller.start_adventure(setting)
    
    print_story(opening)
    
    # Show help hint
    console.print("[dim]Type 'help' for commands, or describe your action to continue.[/dim]")
    
    # Enter game loop
    game_loop(storyteller)


if __name__ == "__main__":
    main()

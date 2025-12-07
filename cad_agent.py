"""
CAD Agent - Translates natural language to CAD DSL patches using xAI API (Grok)

Patch Format:
    AT <feature_id> <ACTION> <JSON_content>

Actions:
    - INSERT: Add a new primitive/feature
    - REPLACE: Modify an existing feature
    - DELETE: Remove a feature

Supported Primitives:
    - cube: { "type": "cube", "width": float, "height": float, "depth": float, "position": [x,y,z], "rotation": [rx,ry,rz] }
    - cylinder: { "type": "cylinder", "radius": float, "height": float, "position": [x,y,z], "rotation": [rx,ry,rz] }
    - sphere: { "type": "sphere", "radius": float, "position": [x,y,z] }
    - cone: { "type": "cone", "radius": float, "height": float, "position": [x,y,z], "rotation": [rx,ry,rz] }
    - torus: { "type": "torus", "radius": float, "tube": float, "position": [x,y,z], "rotation": [rx,ry,rz] }

Features (applied to primitives):
    - fillet: { "type": "fillet", "target": "feature_id", "radius": float, "edges": ["edge_id", ...] }
    - chamfer: { "type": "chamfer", "target": "feature_id", "distance": float, "edges": ["edge_id", ...] }
    - extrude: { "type": "extrude", "sketch": "sketch_id", "distance": float, "direction": [x,y,z] }
"""

import os
import json
import uuid
from dotenv import load_dotenv
from xai_sdk import Client
from xai_sdk.chat import user, system

load_dotenv()

CAD_SYSTEM_PROMPT = """You are a CAD design assistant. Your job is to translate natural language descriptions into CAD DSL patches.

## Patch Format
Each patch line follows this exact format:
AT <feature_id> <ACTION> <JSON_content>

- feature_id: A unique identifier (use format like "feat_001", "feat_002", etc.)
- ACTION: One of INSERT, REPLACE, or DELETE
- JSON_content: A single-line JSON object describing the primitive or feature

## Supported Primitives

1. **cube**
   {"type": "cube", "width": <float>, "height": <float>, "depth": <float>, "position": [x, y, z], "rotation": [rx, ry, rz]}

2. **cylinder**
   {"type": "cylinder", "radius": <float>, "height": <float>, "position": [x, y, z], "rotation": [rx, ry, rz]}

3. **sphere**
   {"type": "sphere", "radius": <float>, "position": [x, y, z]}

4. **cone**
   {"type": "cone", "radius": <float>, "height": <float>, "position": [x, y, z], "rotation": [rx, ry, rz]}

5. **torus**
   {"type": "torus", "radius": <float>, "tube": <float>, "position": [x, y, z], "rotation": [rx, ry, rz]}

## Supported Features (modifiers)

1. **fillet** - Round edges
   {"type": "fillet", "target": "<feature_id>", "radius": <float>}

2. **chamfer** - Bevel edges
   {"type": "chamfer", "target": "<feature_id>", "distance": <float>}

## Rules
1. Always output ONLY the patch lines, no explanations
2. Use metric units (millimeters) for all dimensions
3. Position [0, 0, 0] is the origin/center
4. Rotation is in degrees [rx, ry, rz]
5. Generate sequential feature IDs: feat_001, feat_002, etc.
6. For multiple shapes, output multiple patch lines
7. Keep JSON on a single line per patch

## Examples

User: "Create a box that is 10mm wide, 20mm tall, and 15mm deep"
Output:
AT feat_001 INSERT {"type": "cube", "width": 10, "height": 20, "depth": 15, "position": [0, 0, 0], "rotation": [0, 0, 0]}

User: "Add a cylinder with radius 5mm and height 30mm next to the box"
Output:
AT feat_002 INSERT {"type": "cylinder", "radius": 5, "height": 30, "position": [20, 0, 0], "rotation": [0, 0, 0]}

User: "Create a simple table with 4 legs"
Output:
AT feat_001 INSERT {"type": "cube", "width": 100, "height": 5, "depth": 60, "position": [0, 50, 0], "rotation": [0, 0, 0]}
AT feat_002 INSERT {"type": "cylinder", "radius": 3, "height": 50, "position": [-45, 25, -25], "rotation": [0, 0, 0]}
AT feat_003 INSERT {"type": "cylinder", "radius": 3, "height": 50, "position": [45, 25, -25], "rotation": [0, 0, 0]}
AT feat_004 INSERT {"type": "cylinder", "radius": 3, "height": 50, "position": [-45, 25, 25], "rotation": [0, 0, 0]}
AT feat_005 INSERT {"type": "cylinder", "radius": 3, "height": 50, "position": [45, 25, 25], "rotation": [0, 0, 0]}

User: "Delete the second leg"
Output:
AT feat_003 DELETE {}

User: "Make the table top bigger - 150mm wide"
Output:
AT feat_001 REPLACE {"type": "cube", "width": 150, "height": 5, "depth": 60, "position": [0, 50, 0], "rotation": [0, 0, 0]}
"""


class CADAgent:
    """Agent that converts natural language to CAD DSL patches."""

    def __init__(self, model: str = "grok-3-fast"):
        """Initialize the CAD agent with xAI client."""
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable is required")

        self.client = Client(api_key=api_key, timeout=3600)
        self.model = model
        self.chat = None
        self.features = {}  # Track current features: {feature_id: json_data}
        self.feature_counter = 0
        self._init_chat()

    def _init_chat(self):
        """Initialize a new chat session with the system prompt."""
        self.chat = self.client.chat.create(model=self.model)
        self.chat.append(system(CAD_SYSTEM_PROMPT))

    def _get_context_prompt(self) -> str:
        """Generate context about current features for the LLM."""
        if not self.features:
            return ""

        context = "\n\n[Current Design State]\n"
        for feat_id, data in self.features.items():
            context += f"- {feat_id}: {json.dumps(data)}\n"
        return context

    def generate_patches(self, user_input: str) -> list[dict]:
        """
        Convert natural language input to CAD patches.

        Args:
            user_input: Natural language description of desired CAD operation

        Returns:
            List of parsed patch dictionaries with keys: feature_id, action, data
        """
        # Add context about current state
        context = self._get_context_prompt()
        full_prompt = user_input + context if context else user_input

        self.chat.append(user(full_prompt))
        response = self.chat.sample()

        patches = self._parse_patches(response.content)
        self._apply_patches(patches)

        return patches

    def _parse_patches(self, response: str) -> list[dict]:
        """Parse the LLM response into structured patch objects."""
        patches = []
        lines = response.strip().split('\n')

        for line in lines:
            line = line.strip()
            if not line or not line.startswith('AT '):
                continue

            try:
                # Parse: AT <feature_id> <ACTION> <JSON>
                parts = line[3:].split(' ', 2)  # Remove "AT " and split
                if len(parts) < 2:
                    continue

                feature_id = parts[0]
                action = parts[1].upper()

                if action not in ('INSERT', 'REPLACE', 'DELETE'):
                    continue

                # Parse JSON content
                json_str = parts[2] if len(parts) > 2 else '{}'
                data = json.loads(json_str)

                patches.append({
                    'feature_id': feature_id,
                    'action': action,
                    'data': data
                })

            except (json.JSONDecodeError, IndexError) as e:
                print(f"Warning: Failed to parse patch line: {line}")
                continue

        return patches

    def _apply_patches(self, patches: list[dict]):
        """Apply patches to internal feature state."""
        for patch in patches:
            feat_id = patch['feature_id']
            action = patch['action']
            data = patch['data']

            if action == 'INSERT':
                self.features[feat_id] = data
                # Update counter if needed
                if feat_id.startswith('feat_'):
                    try:
                        num = int(feat_id.split('_')[1])
                        self.feature_counter = max(self.feature_counter, num)
                    except ValueError:
                        pass

            elif action == 'REPLACE':
                self.features[feat_id] = data

            elif action == 'DELETE':
                self.features.pop(feat_id, None)

    def get_current_state(self) -> dict:
        """Return the current design state."""
        return self.features.copy()

    def export_patches_json(self, patches: list[dict]) -> str:
        """Export patches as JSON string for frontend consumption."""
        return json.dumps(patches, indent=2)

    def reset(self):
        """Reset the agent state and start fresh."""
        self.features = {}
        self.feature_counter = 0
        self._init_chat()


def main():
    """Interactive CLI for the CAD agent."""
    print("=" * 60)
    print("CAD Agent - Natural Language to CAD DSL")
    print("=" * 60)
    print("Describe shapes in natural language. Type 'quit' to exit.")
    print("Commands: 'state' - show current design, 'reset' - start over")
    print("=" * 60)
    print()

    agent = CADAgent()

    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        if user_input.lower() in ('quit', 'exit', 'bye'):
            print("Goodbye!")
            break

        if user_input.lower() == 'state':
            state = agent.get_current_state()
            if state:
                print("\n[Current Design State]")
                print(json.dumps(state, indent=2))
            else:
                print("\n[No features in current design]")
            print()
            continue

        if user_input.lower() == 'reset':
            agent.reset()
            print("[Design reset - starting fresh]\n")
            continue

        try:
            patches = agent.generate_patches(user_input)

            if patches:
                print("\n[Generated Patches]")
                for patch in patches:
                    action = patch['action']
                    feat_id = patch['feature_id']
                    data = json.dumps(patch['data'])
                    print(f"AT {feat_id} {action} {data}")
                print()
            else:
                print("\n[No valid patches generated]\n")

        except Exception as e:
            print(f"\n[Error: {e}]\n")


if __name__ == "__main__":
    main()

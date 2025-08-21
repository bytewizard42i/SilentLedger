# SilentLedger Demo Instructions

Welcome to the SilentLedger Demo! This guide is designed for beginners to help you understand how to add new slides to the demo and link them to the input dropdown menu. Follow these steps to customize the demo with your own content.

## Overview of the Demo Mechanics

The demo features an interactive interface with 6 windows:
- **Private Orderbook**
- **Public Orderbook**
- **Private Output**
- **Public Output**
- **Private God View**
- **Public God View**

These windows display content based on 'slides' that are triggered by selecting a command from the input dropdown menu. Each slide contains specific content for each window, and you can cycle through slides using control buttons like 'Start', 'Next', 'Auto', and 'Stop'.

## How to Add a New Slide and Dropdown Item

To add a new slide with corresponding content and link it to a new command in the dropdown menu, follow these steps:

### Step 1: Update the Dropdown Menu

1. Open the file `demo_index.html` in the `Demo_SL` folder.
2. Locate the section with the dropdown content (search for `id="command-dropdown"`).
3. Add a new line for your command inside the `<div id="command-dropdown" class="dropdown-content">` section. Use the format:
   ```html
   <a href="#" onclick="selectCommand('Your New Command Name')">Your New Command Name</a>
   ```
   Replace `Your New Command Name` with a descriptive name for your command (e.g., 'Display Asset Report').

### Step 2: Add a New Slide to the Slides Array

1. Open the file `demo_script.js` in the `Demo_SL` folder.
2. Find the `slides` array (search for `const slides = [`).
3. Add a new slide object to the array before the closing `];`. Use the following template:
   ```javascript
   {
       title: "Slide X - Your Topic",
       privateOrderbook: "Your content for Private Orderbook here.",
       publicOrderbook: "Your content for Public Orderbook here.",
       privateOutput: "Your content for Private Output here.",
       publicOutput: "Your content for Public Output here.",
       privateGod: "Your content for Private God View here.",
       publicGod: "Your content for Public God View here.",
       command: "Your New Command Name"
   }
   ```
   - Replace `Slide X` with the next slide number (e.g., if there are 3 slides already, use 'Slide 4').
   - Replace `Your Topic` with a brief description of the slide's focus (e.g., 'Asset Report').
   - Replace the content placeholders with the text or HTML you want to display in each of the 6 windows.
   - Ensure the `command` field matches exactly with the command name you added to the dropdown in `demo_index.html` (e.g., 'Display Asset Report').

### Step 3: Save and Test

1. Save both `demo_index.html` and `demo_script.js`.
2. Open or refresh the demo in your browser (use `xdg-open Demo_SL/demo_index.html` if needed).
3. Click the dropdown arrow in the input field, select your new command, and verify that the corresponding slide content appears in all 6 windows.
4. Use the 'Next' and 'Auto' buttons to cycle through slides and ensure everything works smoothly.

## Tips for Content Creation

- **Keep Content Distinct**: Use unique titles and content for each slide to easily identify which slide is active.
- **Use HTML if Needed**: You can include HTML tags in the content fields (e.g., `<b>Bold Text</b>`) to format text in the windows.
- **Organize by Topic**: Group related content by slide topic to make the demo logical for viewers.

## Troubleshooting

- If a new command doesn't load the slide, double-check that the `command` field in the `slides` array matches the name used in the dropdown menu exactly.
- If slides don't cycle correctly, ensure no duplicate slide indices or command names exist.

## Questions?

If you have any questions or need assistance, feel free to reach out or refer to the SilentLedger project documentation for more advanced customization options.

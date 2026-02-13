# Lorin's Homepage

A personal startpage/dashboard with a warm paper-and-botanical aesthetic. Features a clock, work/pomodoro tracker, weather widget, YouTube soundscape, and quote rotator.

## Features

### Clock Widget
- Real-time digital clock with animated digit transitions
- Date display showing current date and week number
- Toggle to show/hide seconds (via settings)

### Work Tracker (Pomodoro)
- Tracks work sessions with two modes: **Deep** (focus work) and **Shallow** (light tasks)
- Customizable daily target (default 7:30 hours)
- Visual breakdown bar showing deep vs shallow time
- Persists state to localStorage (survives browser refresh)
- Remembers whether timer was running and resumes on page load

### Weather Widget
- Displays current temperature and conditions
- Uses browser geolocation or defaults to a fixed location

### YouTube Soundscape
- Embedded YouTube video player
- Compact controls for play/pause, progress, and title
- Customizable video URL via settings

### Quote Rotator
- Displays rotating inspirational quotes at the bottom of the page

### Settings
Accessible via the gear icon:
- **YouTube URL**: Change the embedded video
- **Show seconds**: Toggle clock seconds display
- **3D tilt**: Enable/disable card tilt effect on hover
- **Wiggle**: Enable/disable subtle card animation
- **Wiggle intensity**: Low/Medium/High
- **Theme**: System/Light/Dark

### Visual Design
- Warm paper texture with botanical color palette
- Dark mode support (follows system preference or manual toggle)
- Torn-paper edge effects on widgets
- Subtle grain and ink-wash gradients
- Smooth animations and transitions

## Technical Details

- Pure static HTML/CSS/JS - no build step required
- Uses localStorage for persistence
- Responsive design for mobile and desktop
- Respects `prefers-reduced-motion` for accessibility

## Usage

Simply open `index.html` in a browser. The page works standalone without a server.

## Customization

Edit `index.html` directly to:
- Change the default YouTube video ID in the iframe `data-default-id` attribute
- Modify default work target time (search for `7 * 3600 + 30 * 60`)
- Add/modify quotes in the JavaScript section
- Adjust CSS variables for colors and fonts

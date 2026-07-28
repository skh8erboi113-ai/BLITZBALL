# Blitzball League Manager

A full-stack web application for managing a Blitzball league inspired by Final Fantasy X. Features complete CRUD operations, AI match simulation, team management, and player statistics tracking.

## 🎮 Features

### Team Management
- Create, read, update, and delete teams
- View team rosters with full player details
- Track wins, losses, and win percentages
- Auto-generate teams with balanced rosters

### Player Management
- Full CRUD operations for players
- 8 FFX-style stats: HP, SPD, END, ATK, PAS, SHT, BLI, RCH
- Position-based stat bonuses (Forward, Midfielder, Defender, Goalkeeper)
- Level-up system with customizable stat increases
- Player transfer between teams
- Experience point tracking

### Match System
- Schedule matches between teams
- Manual match management (start/finish/score)
- AI-powered full match simulation with event log
- Match status tracking (scheduled/in_progress/completed)
- Automatic team record updates

### Analytics & Statistics
- League standings sorted by wins
- Top scorers leaderboard
- Detailed team statistics with averages
- Player performance rankings
- League overview dashboard

### Advanced Features
- **Team Builder**: Auto-generate teams with 8 balanced players
- **League Seeding**: One-click setup of all 6 FFX Blitzball teams
- **Match Simulator**: AI-driven match simulation with goals, saves, tackles
- **BlitzMath Formula**: Randomized tackle resolution (50%-150% of base ATK)
- **Experience System**: Players gain XP from match events

## 🛠️ Tech Stack

### Backend
- **Python 3.8+**
- **Flask 3.0** - Web framework
- **SQLAlchemy 3.1** - ORM
- **SQLite** - Database
- **Flask-CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with CSS Grid/Flexbox
- **Vanilla JavaScript (ES6+)** - No frameworks
- **Fetch API** - HTTP requests

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Backend Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd blitzball-web

# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py

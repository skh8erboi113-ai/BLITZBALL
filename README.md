# BLITZBALL
# Blitzball League Manager

A full-stack web application for managing a Blitzball league with CRUD operations, team management, player stats, and match simulation using FFX-style mechanics.

## Features

- **Team Management**: Create, read, update, and delete teams
- **Player Management**: Full CRUD for players with FFX-style stats (HP, SPD, END, ATK, PAS, SHT, BLI, RCH)
- **Level System**: Level up players and increase stats
- **Match Scheduling**: Schedule and track matches between teams
- **Blitzball Formula**: Resolve tackle encounters with randomized attack mechanics
- **Responsive UI**: Modern, responsive web interface

## Tech Stack

### Backend
- Python 3.8+
- Flask 2.3
- SQLAlchemy ORM
- SQLite Database
- Flask-CORS

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

## Installation

### Backend Setup

```bash
# Clone repository
git clone <repo-url>
cd blitzball-web/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py

"""
Database models for Blitzball League Manager
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Team(db.Model):
    """Team model"""
    __tablename__ = 'teams'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    city = db.Column(db.String(100))
    coach = db.Column(db.String(100))
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    players = db.relationship('Player', backref='team', lazy='dynamic', cascade='all, delete-orphan')
    home_matches = db.relationship('Match', foreign_keys='Match.home_team_id', backref='home_team', lazy='dynamic')
    away_matches = db.relationship('Match', foreign_keys='Match.away_team_id', backref='away_team', lazy='dynamic')
    
    def to_dict(self, include_roster=False):
        """Convert team to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'city': self.city,
            'coach': self.coach,
            'wins': self.wins,
            'losses': self.losses,
            'record': f"{self.wins}-{self.losses}",
            'games_played': self.wins + self.losses,
            'win_percentage': round((self.wins / (self.wins + self.losses) * 100) if (self.wins + self.losses) > 0 else 0, 2),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_roster:
            data['roster'] = [p.to_dict() for p in self.players.all()]
            data['roster_count'] = self.players.count()
        
        return data
    
    def __repr__(self):
        return f'<Team {self.name}>'


class Player(db.Model):
    """Player model with FFX Blitzball stats"""
    __tablename__ = 'players'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False, index=True)
    position = db.Column(db.String(50), default='Forward', index=True)
    level = db.Column(db.Integer, default=1)
    experience = db.Column(db.Integer, default=0)
    
    # FFX Blitzball Stats
    hp = db.Column(db.Integer, default=100)
    spd = db.Column(db.Integer, default=10)
    end = db.Column(db.Integer, default=10)
    atk = db.Column(db.Integer, default=10)
    pas = db.Column(db.Integer, default=10)
    sht = db.Column(db.Integer, default=10)
    bli = db.Column(db.Integer, default=10)
    rch = db.Column(db.Integer, default=10)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_team=False):
        """Convert player to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'team_id': self.team_id,
            'position': self.position,
            'level': self.level,
            'experience': self.experience,
            'stats': {
                'HP': self.hp,
                'SPD': self.spd,
                'END': self.end,
                'ATK': self.atk,
                'PAS': self.pas,
                'SHT': self.sht,
                'BLI': self.bli,
                'RCH': self.rch
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_team and self.team:
            data['team_name'] = self.team.name
        
        return data
    
    def level_up(self, stat_deltas):
        """Apply level-up stat increases"""
        self.level += 1
        self.experience = 0
        
        stat_mapping = {
            'HP': 'hp', 'SPD': 'spd', 'END': 'end', 'ATK': 'atk',
            'PAS': 'pas', 'SHT': 'sht', 'BLI': 'bli', 'RCH': 'rch'
        }
        
        for stat_key, delta in stat_deltas.items():
            if stat_key in stat_mapping:
                attr = stat_mapping[stat_key]
                current_value = getattr(self, attr)
                setattr(self, attr, current_value + int(delta))
        
        self.updated_at = datetime.utcnow()
        return self
    
    def add_experience(self, amount):
        """Add experience to player"""
        self.experience += amount
        # Auto level-up every 100 XP
        while self.experience >= 100:
            self.experience -= 100
            self.level += 1
        self.updated_at = datetime.utcnow()
    
    def __repr__(self):
        return f'<Player {self.name} ({self.position})>'


class Match(db.Model):
    """Match model"""
    __tablename__ = 'matches'
    
    id = db.Column(db.Integer, primary_key=True)
    home_team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False, index=True)
    away_team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False, index=True)
    home_score = db.Column(db.Integer, default=0)
    away_score = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='scheduled', index=True)  # scheduled, in_progress, completed
    match_date = db.Column(db.DateTime, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert match to dictionary"""
        return {
            'id': self.id,
            'home_team_id': self.home_team_id,
            'away_team_id': self.away_team_id,
            'home_team_name': self.home_team.name if self.home_team else None,
            'away_team_name': self.away_team.name if self.away_team else None,
            'home_score': self.home_score,
            'away_score': self.away_score,
            'status': self.status,
            'match_date': self.match_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'winner': self._get_winner()
        }
    
    def _get_winner(self):
        """Determine match winner"""
        if self.status != 'completed':
            return None
        if self.home_score > self.away_score:
            return 'home'
        elif self.away_score > self.home_score:
            return 'away'
        return 'draw'
    
    def __repr__(self):
        return f'<Match {self.id}: {self.home_team.name if self.home_team else "?"} vs {self.away_team.name if self.away_team else "?"}>'

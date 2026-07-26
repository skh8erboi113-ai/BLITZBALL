from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Team(db.Model):
    __tablename__ = 'teams'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    city = db.Column(db.String(100))
    coach = db.Column(db.String(100))
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    players = db.relationship('Player', backref='team', lazy=True, cascade='all, delete-orphan')
    home_matches = db.relationship('Match', foreign_keys='Match.home_team_id', backref='home_team', lazy=True)
    away_matches = db.relationship('Match', foreign_keys='Match.away_team_id', backref='away_team', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'city': self.city,
            'coach': self.coach,
            'wins': self.wins,
            'losses': self.losses,
            'record': f"{self.wins}-{self.losses}",
            'created_at': self.created_at.isoformat()
        }
    
    def to_dict_with_roster(self):
        data = self.to_dict()
        data['roster'] = [p.to_dict() for p in self.players]
        data['roster_count'] = len(self.players)
        return data


class Player(db.Model):
    __tablename__ = 'players'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    position = db.Column(db.String(50), default='Forward')
    level = db.Column(db.Integer, default=1)
    experience = db.Column(db.Integer, default=0)
    
    # Base Stats
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
    
    def to_dict(self):
        return {
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
    
    def level_up(self, stat_deltas):
        """Apply level-up stat changes"""
        self.level += 1
        self.experience = 0
        
        stat_mapping = {
            'HP': 'hp',
            'SPD': 'spd',
            'END': 'end',
            'ATK': 'atk',
            'PAS': 'pas',
            'SHT': 'sht',
            'BLI': 'bli',
            'RCH': 'rch'
        }
        
        for stat_key, delta in stat_deltas.items():
            if stat_key in stat_mapping:
                attr = stat_mapping[stat_key]
                current = getattr(self, attr)
                setattr(self, attr, current + delta)
        
        self.updated_at = datetime.utcnow()
        return self.to_dict()


class Match(db.Model):
    __tablename__ = 'matches'
    
    id = db.Column(db.Integer, primary_key=True)
    home_team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    away_team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    home_score = db.Column(db.Integer, default=0)
    away_score = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, in_progress, completed
    match_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
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
            'created_at': self.created_at.isoformat()
        }

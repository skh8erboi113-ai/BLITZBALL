"""
Match simulation routes with AI
"""
from flask import Blueprint, jsonify
from backend.models import db, Match, Player
from datetime import datetime
import random

simulation_bp = Blueprint('simulation', __name__, url_prefix='/simulation')

class MatchSimulator:
    """AI-powered match simulator"""
    
    MATCH_DURATION_MINUTES = 10
    TACKLE_MIN_FACTOR = 0.50
    TACKLE_MAX_FACTOR = 1.50
    
    def __init__(self, match):
        self.match = match
        self.home_roster = list(match.home_team.players.all())
        self.away_roster = list(match.away_team.players.all())
        self.events = []
        self.home_score = 0
        self.away_score = 0
        self.current_minute = 0
    
    def simulate(self):
        """Run full match simulation"""
        if self.match.status == 'completed':
            raise ValueError("Match already completed")
        
        if not self.home_roster or not self.away_roster:
            raise ValueError("Both teams need players to simulate")
        
        self.match.status = 'in_progress'
        db.session.commit()
        
        # First half
        for minute in range(1, 6):
            self.current_minute = minute
            self._simulate_minute()
        
        self._add_event('halftime', None, "HALF-TIME", {
            'home_score': self.home_score,
            'away_score': self.away_score
        })
        
        # Second half
        for minute in range(6, 11):
            self.current_minute = minute
            self._simulate_minute()
        
        self._finalize_match()
        
        return {
            'match_id': self.match.id,
            'home_team': self.match.home_team.name,
            'away_team': self.match.away_team.name,
            'final_score': {
                'home': self.home_score,
                'away': self.away_score
            },
            'events': self.events,
            'winner': self._determine_winner()
        }
    
    def _simulate_minute(self):
        """Simulate one minute of gameplay"""
        # Random possession
        attacking_team = random.choice(['home', 'away'])
        
        # 30% chance of goal attempt per minute
        if random.random() < 0.30:
            self._simulate_attack(attacking_team)
        
        # 20% chance of tackle encounter
        if random.random() < 0.20:
            self._simulate_tackle(attacking_team)
    
    def _simulate_attack(self, attacking_team):
        """Simulate a goal-scoring attempt"""
        if attacking_team == 'home':
            attackers = self.home_roster
            defenders = self.away_roster
        else:
            attackers = self.away_roster
            defenders = self.home_roster
        
        # Select shooter (prefer forwards)
        forwards = [p for p in attackers if p.position == 'Forward']
        shooter = random.choice(forwards if forwards else attackers)
        
        # Shot power
        shot_power = shooter.sht + random.randint(-5, 5)
        
        # Goalkeeper save
        goalkeepers = [p for p in defenders if p.position == 'Goalkeeper']
        if goalkeepers:
            keeper = max(goalkeepers, key=lambda p: p.bli)
            save_power = keeper.bli + random.randint(-5, 5)
        else:
            save_power = 10
        
        # Determine outcome
        if shot_power > save_power:
            # GOAL!
            if attacking_team == 'home':
                self.home_score += 1
            else:
                self.away_score += 1
            
            self._add_event('goal', shooter, f"⚽ GOAL! {shooter.name} scores!", {
                'minute': self.current_minute,
                'shot_power': shot_power,
                'team': attacking_team
            })
            
            shooter.add_experience(10)
        else:
            # Save
            if goalkeepers:
                self._add_event('save', keeper, f"🧤 SAVE! {keeper.name} blocks the shot!", {
                    'minute': self.current_minute,
                    'shooter': shooter.name
                })
                keeper.add_experience(5)
    
    def _simulate_tackle(self, attacking_team):
        """Simulate a tackle encounter"""
        if attacking_team == 'home':
            carrier_roster = self.home_roster
            defender_roster = self.away_roster
        else:
            carrier_roster = self.away_roster
            defender_roster = self.home_roster
        
        carrier = random.choice(carrier_roster)
        num_defenders = random.randint(1, min(2, len(defender_roster)))
        defenders = random.sample(defender_roster, num_defenders)
        
        # Resolve tackle
        current_end = carrier.end
        stopper = None
        
        for defender in defenders:
            factor = random.uniform(self.TACKLE_MIN_FACTOR, self.TACKLE_MAX_FACTOR)
            effective_atk = int(defender.atk * factor)
            current_end -= effective_atk
            
            if current_end <= 0:
                stopper = defender
                break
        
        if stopper:
            self._add_event('tackle', stopper, f"🛡️ TACKLE! {stopper.name} steals from {carrier.name}!", {
                'minute': self.current_minute,
                'carrier': carrier.name
            })
            stopper.add_experience(3)
        else:
            self._add_event('breakthrough', carrier, f"⚡ {carrier.name} breaks through!", {
                'minute': self.current_minute,
                'remaining_end': current_end
            })
            carrier.add_experience(2)
    
    def _add_event(self, event_type, player, description, metadata):
        """Record match event"""
        self.events.append({
            'type': event_type,
            'player_id': player.id if player else None,
            'player_name': player.name if player else None,
            'description': description,
            'metadata': metadata,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    def _finalize_match(self):
        """Complete the match"""
        self.match.home_score = self.home_score
        self.match.away_score = self.away_score
        self.match.status = 'completed'
        self.match.completed_at = datetime.utcnow()
        
        # Update team records
        if self.home_score > self.away_score:
            self.match.home_team.wins += 1
            self.match.away_team.losses += 1
        elif self.away_score > self.home_score:
            self.match.away_team.wins += 1
            self.match.home_team.losses += 1
        
        self._add_event('final_whistle', None, "🏁 FULL TIME!", {
            'final_score': {'home': self.home_score, 'away': self.away_score}
        })
        
        db.session.commit()
    
    def _determine_winner(self):
        """Determine match winner"""
        if self.home_score > self.away_score:
            return {
                'result': 'home_win',
                'winner': self.match.home_team.name
            }
        elif self.away_score > self.home_score:
            return {
                'result': 'away_win',
                'winner': self.match.away_team.name
            }
        return {
            'result': 'draw',
            'winner': None
        }

@simulation_bp.route('/match/<int:match_id>/simulate', methods=['POST'])
def simulate_match(match_id):
    """Run full AI simulation of a match"""
    match = Match.query.get_or_404(match_id)
    
    try:
        simulator = MatchSimulator(match)
        result = simulator.simulate()
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Simulation failed: {str(e)}'}), 500

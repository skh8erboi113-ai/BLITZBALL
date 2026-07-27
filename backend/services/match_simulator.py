"""
Match Simulator - Advanced AI for automated Blitzball matches
"""

import random
from backend.models import db, Match, Player, Team
from datetime import datetime

class MatchSimulator:
    """Simulates a full Blitzball match with AI logic"""
    
    MATCH_DURATION_MINUTES = 10  # Real Blitzball match length
    TACKLE_MIN_FACTOR = 0.50
    TACKLE_MAX_FACTOR = 1.50
    
    def __init__(self, match_id):
        self.match = Match.query.get(match_id)
        if not self.match:
            raise ValueError(f"Match {match_id} not found")
        
        self.home_roster = self.match.home_team.players
        self.away_roster = self.match.away_team.players
        self.events = []
        self.home_score = 0
        self.away_score = 0
        self.current_minute = 0
        
    def simulate_full_match(self):
        """Run a full automated match simulation"""
        if self.match.status == 'completed':
            raise ValueError("Match already completed")
        
        self.match.status = 'in_progress'
        db.session.commit()
        
        # First half (5 minutes)
        for minute in range(1, 6):
            self.current_minute = minute
            self._simulate_minute()
        
        # Half-time
        self._add_event('halftime', None, "HALF-TIME", {
            'home_score': self.home_score,
            'away_score': self.away_score
        })
        
        # Second half (5 minutes)
        for minute in range(6, 11):
            self.current_minute = minute
            self._simulate_minute()
        
        # Final whistle
        self._finalize_match()
        
        return {
            'match_id': self.match.id,
            'final_score': {
                'home': self.home_score,
                'away': self.away_score
            },
            'events': self.events,
            'winner': self._determine_winner()
        }
    
    def _simulate_minute(self):
        """Simulate one minute of gameplay"""
        # Determine possession (50/50 or based on team stats)
        attacking_team = random.choice(['home', 'away'])
        
        # Random chance of goal attempt (30% per minute)
        if random.random() < 0.30:
            self._simulate_attack(attacking_team)
        
        # Random chance of tackle/turnover (20% per minute)
        if random.random() < 0.20:
            self._simulate_tackle(attacking_team)
    
    def _simulate_attack(self, attacking_team):
        """Simulate a goal-scoring attempt"""
        if attacking_team == 'home':
            roster = self.home_roster
            defending_team = 'away'
        else:
            roster = self.away_roster
            defending_team = 'home'
        
        # Pick a random attacker
        forwards = [p for p in roster if p.position == 'Forward']
        if not forwards:
            forwards = roster  # Fallback to any player
        
        if not forwards:
            return
        
        shooter = random.choice(forwards)
        
        # Shot power based on SHT stat
        shot_power = shooter.sht + random.randint(-5, 5)
        
        # Goalkeeper save based on defending team's best goalkeeper
        if defending_team == 'home':
            defending_roster = self.home_roster
        else:
            defending_roster = self.away_roster
        
        goalkeepers = [p for p in defending_roster if p.position == 'Goalkeeper']
        if goalkeepers:
            keeper = max(goalkeepers, key=lambda p: p.bli)  # BLI = block/save
            save_power = keeper.bli + random.randint(-5, 5)
        else:
            save_power = 10  # Default if no keeper
        
        # Determine if goal scored
        if shot_power > save_power:
            # GOAL!
            if attacking_team == 'home':
                self.home_score += 1
            else:
                self.away_score += 1
            
            self._add_event('goal', shooter, f"GOAL! {shooter.name} scores!", {
                'minute': self.current_minute,
                'shot_power': shot_power,
                'save_power': save_power,
                'team': attacking_team
            })
            
            # Award experience
            shooter.experience += 10
            db.session.commit()
        else:
            # Save!
            if goalkeepers:
                self._add_event('save', keeper, f"SAVE! {keeper.name} blocks the shot!", {
                    'minute': self.current_minute,
                    'shooter': shooter.name,
                    'team': defending_team
                })
                keeper.experience += 5
                db.session.commit()
    
    def _simulate_tackle(self, attacking_team):
        """Simulate a tackle encounter"""
        if attacking_team == 'home':
            carrier_roster = self.home_roster
            defender_roster = self.away_roster
            defending_team = 'away'
        else:
            carrier_roster = self.away_roster
            defender_roster = self.home_roster
            defending_team = 'home'
        
        if not carrier_roster or not defender_roster:
            return
        
        carrier = random.choice(carrier_roster)
        
        # Select 1-2 defenders
        num_defenders = random.randint(1, min(2, len(defender_roster)))
        defenders = random.sample(defender_roster, num_defenders)
        
        # Run tackle formula
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
            # Ball stolen!
            self._add_event('tackle', stopper, f"TACKLE! {stopper.name} steals the ball from {carrier.name}!", {
                'minute': self.current_minute,
                'carrier': carrier.name,
                'team': defending_team
            })
            stopper.experience += 3
            db.session.commit()
        else:
            # Carrier breaks through
            self._add_event('breakthrough', carrier, f"{carrier.name} breaks through the defense!", {
                'minute': self.current_minute,
                'remaining_end': current_end,
                'team': attacking_team
            })
            carrier.experience += 2
            db.session.commit()
    
    def _add_event(self, event_type, player, description, metadata):
        """Record a match event"""
        event = {
            'type': event_type,
            'player_id': player.id if player else None,
            'player_name': player.name if player else None,
            'description': description,
            'metadata': metadata,
            'timestamp': datetime.utcnow().isoformat()
        }
        self.events.append(event)
    
    def _finalize_match(self):
        """Finalize match and update records"""
        self.match.home_score = self.home_score
        self.match.away_score = self.away_score
        self.match.status = 'completed'
        
        # Update team records
        if self.home_score > self.away_score:
            self.match.home_team.wins += 1
            self.match.away_team.losses += 1
            winner = 'home'
        elif self.away_score > self.home_score:
            self.match.away_team.wins += 1
            self.match.home_team.losses += 1
            winner = 'away'
        else:
            winner = 'draw'
        
        self._add_event('final_whistle', None, "FULL TIME!", {
            'final_score': {
                'home': self.home_score,
                'away': self.away_score
            },
            'winner': winner
        })
        
        db.session.commit()
    
    def _determine_winner(self):
        """Return match result"""
        if self.home_score > self.away_score:
            return {
                'result': 'home_win',
                'winner_id': self.match.home_team_id,
                'winner_name': self.match.home_team.name
            }
        elif self.away_score > self.home_score:
            return {
                'result': 'away_win',
                'winner_id': self.match.away_team_id,
                'winner_name': self.match.away_team.name
            }
        else:
            return {
                'result': 'draw',
                'winner_id': None,
                'winner_name': None
            }

"""
Team Builder - Automatically generate teams with balanced rosters
"""

from backend.models import db, Team, Player
import random

class TeamBuilder:
    """Builds complete teams with auto-generated players"""
    
    POSITIONS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper']
    
    FIRST_NAMES = [
        'Tidus', 'Wakka', 'Datto', 'Keepa', 'Jassu', 'Letty', 'Botta',
        'Nedus', 'Ropp', 'Graav', 'Abus', 'Balgerda', 'Berrik', 'Nimrook',
        'Zalitz', 'Vilucha', 'Irga', 'Kulukan', 'Eigaar', 'Nuvy', 'Raudy'
    ]
    
    LAST_NAMES = [
        'Swift', 'Thunder', 'Wave', 'Storm', 'Blaze', 'Frost', 'Shadow',
        'Lightning', 'Tsunami', 'Hurricane', 'Vortex', 'Tempest'
    ]
    
    @staticmethod
    def build_team(team_name, city=None, coach=None, skill_level='medium'):
        """
        Create a team with a full roster
        skill_level: 'rookie', 'medium', 'veteran', 'champion'
        """
        # Create team
        team = Team(name=team_name, city=city, coach=coach)
        db.session.add(team)
        db.session.flush()  # Get team ID without committing
        
        # Define roster structure
        roster_structure = [
            ('Forward', 3),
            ('Midfielder', 2),
            ('Defender', 2),
            ('Goalkeeper', 1)
        ]
        
        # Stat ranges by skill level
        stat_ranges = {
            'rookie': {'min': 5, 'max': 15, 'hp_mult': 50},
            'medium': {'min': 10, 'max': 25, 'hp_mult': 100},
            'veteran': {'min': 20, 'max': 40, 'hp_mult': 200},
            'champion': {'min': 35, 'max': 60, 'hp_mult': 300}
        }
        
        range_cfg = stat_ranges.get(skill_level, stat_ranges['medium'])
        
        players = []
        for position, count in roster_structure:
            for i in range(count):
                player_name = TeamBuilder._generate_name()
                stats = TeamBuilder._generate_stats(position, range_cfg)
                
                player = Player(
                    name=player_name,
                    team_id=team.id,
                    position=position,
                    hp=stats['HP'],
                    spd=stats['SPD'],
                    end=stats['END'],
                    atk=stats['ATK'],
                    pas=stats['PAS'],
                    sht=stats['SHT'],
                    bli=stats['BLI'],
                    rch=stats['RCH']
                )
                players.append(player)
                db.session.add(player)
        
        db.session.commit()
        
        return {
            'team': team.to_dict(),
            'roster': [p.to_dict() for p in players],
            'roster_count': len(players)
        }
    
    @staticmethod
    def _generate_name():
        """Generate random player name"""
        first = random.choice(TeamBuilder.FIRST_NAMES)
        last = random.choice(TeamBuilder.LAST_NAMES)
        return f"{first} {last}"
    
    @staticmethod
    def _generate_stats(position, range_cfg):
        """Generate stats based on position and skill level"""
        min_stat = range_cfg['min']
        max_stat = range_cfg['max']
        hp_mult = range_cfg['hp_mult']
        
        # Base stats
        stats = {
            'HP': random.randint(min_stat * 5, max_stat * 5) + hp_mult,
            'SPD': random.randint(min_stat, max_stat),
            'END': random.randint(min_stat, max_stat),
            'ATK': random.randint(min_stat, max_stat),
            'PAS': random.randint(min_stat, max_stat),
            'SHT': random.randint(min_stat, max_stat),
            'BLI': random.randint(min_stat, max_stat),
            'RCH': random.randint(min_stat, max_stat)
        }
        
        # Position-specific boosts
        if position == 'Forward':
            stats['SHT'] += random.randint(5, 15)
            stats['SPD'] += random.randint(3, 10)
        elif position == 'Midfielder':
            stats['PAS'] += random.randint(5, 15)
            stats['END'] += random.randint(3, 10)
        elif position == 'Defender':
            stats['ATK'] += random.randint(5, 15)
            stats['BLI'] += random.randint(3, 10)
        elif position == 'Goalkeeper':
            stats['BLI'] += random.randint(10, 20)
            stats['RCH'] += random.randint(5, 15)
            stats['HP'] += random.randint(50, 100)
        
        return stats
    
    @staticmethod
    def seed_default_league():
        """Create the classic FFX Blitzball teams"""
        teams_config = [
            ('Besaid Aurochs', 'Besaid', 'Wakka', 'rookie'),
            ('Luca Goers', 'Luca', 'Abus', 'champion'),
            ('Kilika Beasts', 'Kilika', 'Duram', 'medium'),
            ('Al Bhed Psyches', 'Al Bhed', 'Nimrook', 'veteran'),
            ('Ronso Fangs', 'Mt. Gagazet', 'Zamzi', 'veteran'),
            ('Guado Glories', 'Guadosalam', 'Jumal', 'medium')
        ]
        
        results = []
        for team_name, city, coach, skill in teams_config:
            # Check if team already exists
            existing = Team.query.filter_by(name=team_name).first()
            if existing:
                continue
            
            result = TeamBuilder.build_team(team_name, city, coach, skill)
            results.append(result)
        
        return results

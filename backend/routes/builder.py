"""
Team builder routes - Auto-generate teams and players
"""
from flask import Blueprint, request, jsonify
from backend.models import db, Team, Player
import random

builder_bp = Blueprint('builder', __name__, url_prefix='/builder')

class TeamBuilder:
    """Auto-generate balanced teams"""
    
    FIRST_NAMES = [
        'Tidus', 'Wakka', 'Datto', 'Keepa', 'Jassu', 'Letty', 'Botta',
        'Nedus', 'Ropp', 'Graav', 'Abus', 'Balgerda', 'Berrik', 'Nimrook',
        'Zalitz', 'Vilucha', 'Irga', 'Kulukan', 'Eigaar', 'Nuvy', 'Raudy',
        'Shaami', 'Linna', 'Kyou', 'Mifurey', 'Naida', 'Pah', 'Wedge',
        'Biggs', 'Jassu', 'Kiyuri', 'Mep', 'Navara', 'Radbaz', 'Ropp'
    ]
    
    LAST_NAMES = [
        'Swift', 'Thunder', 'Wave', 'Storm', 'Blaze', 'Frost', 'Shadow',
        'Lightning', 'Tsunami', 'Hurricane', 'Vortex', 'Tempest', 'Cyclone',
        'Tornado', 'Gale', 'Breeze', 'Zephyr', 'Squall', 'Typhoon', 'Monsoon'
    ]
    
    @staticmethod
    def build_team(name, city=None, coach=None, skill_level='medium'):
        """Build a complete team with roster"""
        # Stat ranges by skill level
        stat_ranges = {
            'rookie': {'min': 5, 'max': 15, 'hp_base': 50},
            'medium': {'min': 10, 'max': 25, 'hp_base': 100},
            'veteran': {'min': 20, 'max': 40, 'hp_base': 200},
            'champion': {'min': 35, 'max': 60, 'hp_base': 300}
        }
        
        cfg = stat_ranges.get(skill_level, stat_ranges['medium'])
        
        # Create team
        team = Team(name=name, city=city, coach=coach)
        db.session.add(team)
        db.session.flush()
        
        # Roster structure: 3 Forwards, 2 Midfielders, 2 Defenders, 1 Goalkeeper
        roster_structure = [
            ('Forward', 3),
            ('Midfielder', 2),
            ('Defender', 2),
            ('Goalkeeper', 1)
        ]
        
        players = []
        for position, count in roster_structure:
            for _ in range(count):
                player_name = TeamBuilder._generate_name()
                stats = TeamBuilder._generate_stats(position, cfg)
                
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
    def _generate_stats(position, cfg):
        """Generate position-appropriate stats"""
        min_s = cfg['min']
        max_s = cfg['max']
        hp_base = cfg['hp_base']
        
        stats = {
            'HP': random.randint(min_s * 5, max_s * 5) + hp_base,
            'SPD': random.randint(min_s, max_s),
            'END': random.randint(min_s, max_s),
            'ATK': random.randint(min_s, max_s),
            'PAS': random.randint(min_s, max_s),
            'SHT': random.randint(min_s, max_s),
            'BLI': random.randint(min_s, max_s),
            'RCH': random.randint(min_s, max_s)
        }
        
        # Position-specific bonuses
        bonuses = {
            'Forward': [('SHT', 15), ('SPD', 10)],
            'Midfielder': [('PAS', 15), ('END', 10)],
            'Defender': [('ATK', 15), ('BLI', 10)],
            'Goalkeeper': [('BLI', 20), ('RCH', 15), ('HP', 100)]
        }
        
        for stat, bonus in bonuses.get(position, []):
            stats[stat] += bonus
        
        return stats
    
    @staticmethod
    def seed_ffx_league():
        """Create the 6 classic FFX Blitzball teams"""
        teams_config = [
            ('Besaid Aurochs', 'Besaid Island', 'Wakka', 'rookie'),
            ('Luca Goers', 'Luca', 'Abus', 'champion'),
            ('Kilika Beasts', 'Kilika', 'Durren', 'medium'),
            ('Al Bhed Psyches', 'Al Bhed Desert', 'Nimrook', 'veteran'),
            ('Ronso Fangs', 'Mt. Gagazet', 'Zamzi Ronso', 'veteran'),
            ('Guado Glories', 'Guadosalam', 'Jumal', 'medium')
        ]
        
        results = []
        for team_name, city, coach, skill in teams_config:
            # Check if team exists
            existing = Team.query.filter_by(name=team_name).first()
            if existing:
                continue
            
            try:
                result = TeamBuilder.build_team(team_name, city, coach, skill)
                results.append(result)
            except Exception as e:
                db.session.rollback()
                raise e
        
        return results

@builder_bp.route('/team', methods=['POST'])
def build_team():
    """Auto-generate a team with full roster"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Team name is required'}), 400
    
    # Check if team already exists
    existing = Team.query.filter_by(name=data['name']).first()
    if existing:
        return jsonify({'error': f"Team '{data['name']}' already exists"}), 409
    
    try:
        result = TeamBuilder.build_team(
            name=data['name'],
            city=data.get('city'),
            coach=data.get('coach'),
            skill_level=data.get('skill_level', 'medium')
        )
        return jsonify(result), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@builder_bp.route('/seed-league', methods=['POST'])
def seed_league():
    """Seed database with FFX teams"""
    try:
        results = TeamBuilder.seed_ffx_league()
        
        if not results:
            return jsonify({
                'message': 'All FFX teams already exist',
                'teams': []
            }), 200
        
        return jsonify({
            'message': f'Successfully created {len(results)} teams',
            'teams': results
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

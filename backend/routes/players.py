from flask import Blueprint, request, jsonify
from backend.models import db, Player, Team

bp = Blueprint('players', __name__, url_prefix='/players')

@bp.route('', methods=['GET'])
def get_all_players():
    """Get all players"""
    players = Player.query.all()
    return jsonify([p.to_dict() for p in players]), 200

@bp.route('/<int:player_id>', methods=['GET'])
def get_player(player_id):
    """Get a specific player"""
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    return jsonify(player.to_dict()), 200

@bp.route('', methods=['POST'])
def create_player():
    """Create a new player"""
    data = request.get_json()
    
    required = ['name', 'team_id']
    if not data or not all(k in data for k in required):
        return jsonify({'error': 'Name and team_id required'}), 400
    
    team = Team.query.get(data['team_id'])
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    
    try:
        player = Player(
            name=data['name'],
            team_id=data['team_id'],
            position=data.get('position', 'Forward'),
            hp=data.get('hp', 100),
            spd=data.get('spd', 10),
            end=data.get('end', 10),
            atk=data.get('atk', 10),
            pas=data.get('pas', 10),
            sht=data.get('sht', 10),
            bli=data.get('bli', 10),
            rch=data.get('rch', 10)
        )
        db.session.add(player)
        db.session.commit()
        return jsonify(player.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:player_id>', methods=['PUT'])
def update_player(player_id):
    """Update player stats"""
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    data = request.get_json()
    
    # Update basic info
    if 'name' in data:
        player.name = data['name']
    if 'position' in data:
        player.position = data['position']
    
    # Update stats
    stat_fields = ['hp', 'spd', 'end', 'atk', 'pas', 'sht', 'bli', 'rch']
    for stat in stat_fields:
        if stat in data:
            setattr(player, stat, data[stat])
    
    db.session.commit()
    return jsonify(player.to_dict()), 200

@bp.route('/<int:player_id>/levelup', methods=['POST'])
def level_up_player(player_id):
    """Level up a player with stat deltas"""
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    data = request.get_json()
    if not data or 'stat_deltas' not in data:
        return jsonify({'error': 'stat_deltas required'}), 400
    
    try:
        result = player.level_up(data['stat_deltas'])
        db.session.commit()
        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:player_id>', methods=['DELETE'])
def delete_player(player_id):
    """Delete/release a player from their team"""
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    db.session.delete(player)
    db.session.commit()
    return jsonify({'message': 'Player deleted'}), 200

@bp.route('/<int:player_id>/transfer', methods=['POST'])
def transfer_player(player_id):
    """Transfer a player to another team"""
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    data = request.get_json()
    if not data or 'new_team_id' not in data:
        return jsonify({'error': 'new_team_id required'}), 400
    
    new_team = Team.query.get(data['new_team_id'])
    if not new_team:
        return jsonify({'error': 'New team not found'}), 404
    
    player.team_id = new_team.id
    db.session.commit()
    return jsonify(player.to_dict()), 200

from flask import Blueprint, request, jsonify
from backend.models import db, Team, Player
from sqlalchemy.exc import IntegrityError

bp = Blueprint('teams', __name__, url_prefix='/teams')

@bp.route('', methods=['GET'])
def get_all_teams():
    """Get all teams"""
    teams = Team.query.all()
    return jsonify([t.to_dict() for t in teams]), 200

@bp.route('/<int:team_id>', methods=['GET'])
def get_team(team_id):
    """Get a specific team with roster"""
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    return jsonify(team.to_dict_with_roster()), 200

@bp.route('', methods=['POST'])
def create_team():
    """Create a new team"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Team name required'}), 400
    
    try:
        team = Team(
            name=data['name'],
            city=data.get('city'),
            coach=data.get('coach')
        )
        db.session.add(team)
        db.session.commit()
        return jsonify(team.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Team name already exists'}), 409

@bp.route('/<int:team_id>', methods=['PUT'])
def update_team(team_id):
    """Update team information"""
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    
    data = request.get_json()
    if 'name' in data:
        team.name = data['name']
    if 'city' in data:
        team.city = data['city']
    if 'coach' in data:
        team.coach = data['coach']
    
    db.session.commit()
    return jsonify(team.to_dict()), 200

@bp.route('/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    """Delete a team and all associated players"""
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    
    db.session.delete(team)
    db.session.commit()
    return jsonify({'message': 'Team deleted'}), 200

@bp.route('/<int:team_id>/roster', methods=['GET'])
def get_roster(team_id):
    """Get team roster"""
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    
    return jsonify({
        'team_id': team.id,
        'team_name': team.name,
        'roster': [p.to_dict() for p in team.players],
        'roster_count': len(team.players)
    }), 200

"""
Team management routes
"""
from flask import Blueprint, request, jsonify
from backend.models import db, Team
from sqlalchemy.exc import IntegrityError

teams_bp = Blueprint('teams', __name__, url_prefix='/teams')

@teams_bp.route('', methods=['GET'])
def get_all_teams():
    """Get all teams"""
    teams = Team.query.order_by(Team.wins.desc()).all()
    return jsonify([team.to_dict() for team in teams]), 200

@teams_bp.route('/<int:team_id>', methods=['GET'])
def get_team(team_id):
    """Get a specific team with roster"""
    team = Team.query.get_or_404(team_id)
    return jsonify(team.to_dict(include_roster=True)), 200

@teams_bp.route('', methods=['POST'])
def create_team():
    """Create a new team"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Team name is required'}), 400
    
    try:
        team = Team(
            name=data['name'].strip(),
            city=data.get('city', '').strip() or None,
            coach=data.get('coach', '').strip() or None
        )
        db.session.add(team)
        db.session.commit()
        return jsonify(team.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': f"Team '{data['name']}' already exists"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/<int:team_id>', methods=['PUT'])
def update_team(team_id):
    """Update team information"""
    team = Team.query.get_or_404(team_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        if 'name' in data:
            team.name = data['name'].strip()
        if 'city' in data:
            team.city = data['city'].strip() or None
        if 'coach' in data:
            team.coach = data['coach'].strip() or None
        
        db.session.commit()
        return jsonify(team.to_dict()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Team name already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    """Delete a team and all associated players"""
    team = Team.query.get_or_404(team_id)
    
    try:
        team_name = team.name
        db.session.delete(team)
        db.session.commit()
        return jsonify({'message': f"Team '{team_name}' deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/<int:team_id>/roster', methods=['GET'])
def get_roster(team_id):
    """Get team roster"""
    team = Team.query.get_or_404(team_id)
    
    players = [p.to_dict() for p in team.players.all()]
    
    return jsonify({
        'team_id': team.id,
        'team_name': team.name,
        'roster': players,
        'roster_count': len(players)
    }), 200

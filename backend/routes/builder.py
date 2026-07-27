"""
Team Builder Routes - Auto-generate teams
"""

from flask import Blueprint, request, jsonify
from backend.services.team_builder import TeamBuilder

bp = Blueprint('builder', __name__, url_prefix='/builder')

@bp.route('/team', methods=['POST'])
def build_team():
    """Auto-generate a team with full roster"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Team name required'}), 400
    
    try:
        result = TeamBuilder.build_team(
            team_name=data['name'],
            city=data.get('city'),
            coach=data.get('coach'),
            skill_level=data.get('skill_level', 'medium')
        )
        return jsonify(result), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/seed-league', methods=['POST'])
def seed_default_league():
    """Seed the database with FFX teams"""
    try:
        results = TeamBuilder.seed_default_league()
        return jsonify({
            'message': f'Created {len(results)} teams',
            'teams': results
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

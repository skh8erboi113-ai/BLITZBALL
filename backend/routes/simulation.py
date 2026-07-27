"""
Simulation Routes - AI match simulation endpoints
"""

from flask import Blueprint, request, jsonify
from backend.models import db, Match
from backend.services.match_simulator import MatchSimulator

bp = Blueprint('simulation', __name__, url_prefix='/simulation')

@bp.route('/match/<int:match_id>/simulate', methods=['POST'])
def simulate_match(match_id):
    """Run AI simulation of entire match"""
    try:
        simulator = MatchSimulator(match_id)
        result = simulator.simulate_full_match()
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Simulation failed: {str(e)}'}), 500

@bp.route('/match/<int:match_id>/events', methods=['GET'])
def get_match_events(match_id):
    """Get all events from a simulated match"""
    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404
    
    # In a production app, you'd store events in the database
    # For now, return a placeholder
    return jsonify({
        'match_id': match_id,
        'events': [],
        'message': 'Run simulation first to generate events'
    }), 200

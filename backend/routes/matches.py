"""
Match management routes
"""
from flask import Blueprint, request, jsonify
from backend.models import db, Match, Team, Player
from datetime import datetime
import random

matches_bp = Blueprint('matches', __name__, url_prefix='/matches')


class BlitzMath:
    """Blitzball encounter formula"""

    TACKLE_MIN_FACTOR = 0.50
    TACKLE_MAX_FACTOR = 1.50

    @staticmethod
    def resolve_encounter(carrier_end, defenders):
        """Resolve a tackle encounter"""
        if not defenders:
            return {
                'success': True,
                'remaining_end': carrier_end,
                'stopper_id': -1,
                'tackle_log': []
            }

        current_end = carrier_end
        log = []
        stopper_id = -1

        for defender in defenders:
            if 'id' not in defender or 'atk' not in defender:
                continue

            base_atk = int(defender['atk'])
            if base_atk <= 0:
                continue

            factor = random.uniform(BlitzMath.TACKLE_MIN_FACTOR, BlitzMath.TACKLE_MAX_FACTOR)
            effective_atk = int(base_atk * factor)
            current_end -= effective_atk

            log.append({
                'defender_id': defender['id'],
                'base_atk': base_atk,
                'effective_atk': effective_atk,
                'end_after': current_end
            })

            if current_end <= 0:
                stopper_id = defender['id']
                break

        return {
            'success': stopper_id == -1,
            'remaining_end': current_end,
            'stopper_id': stopper_id,
            'tackle_log': log
        }


@matches_bp.route('', methods=['GET'])
def get_all_matches():
    """Get all matches with optional status filter"""
    status = request.args.get('status')

    query = Match.query
    if status:
        query = query.filter_by(status=status)

    matches = query.order_by(Match.match_date.desc()).all()
    return jsonify([m.to_dict() for m in matches]), 200


@matches_bp.route('/<int:match_id>', methods=['GET'])
def get_match(match_id):
    """Get a specific match"""
    match = Match.query.get_or_404(match_id)
    return jsonify(match.to_dict()), 200


@matches_bp.route('', methods=['POST'])
def create_match():
    """Create/schedule a new match"""
    data = request.get_json()

    required_fields = ['home_team_id', 'away_team_id', 'match_date']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'home_team_id, away_team_id, and match_date are required'}), 400

    home_team = Team.query.get(data['home_team_id'])
    away_team = Team.query.get(data['away_team_id'])

    if not home_team or not away_team:
        return jsonify({'error': 'One or both teams not found'}), 404

    if home_team.id == away_team.id:
        return jsonify({'error': 'A team cannot play against itself'}), 400

    try:
        match_date = datetime.fromisoformat(data['match_date'].replace('Z', '+00:00'))

        match = Match(
            home_team_id=data['home_team_id'],
            away_team_id=data['away_team_id'],
            match_date=match_date
        )
        db.session.add(match)
        db.session.commit()
        return jsonify(match.to_dict()), 201
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@matches_bp.route('/<int:match_id>/start', methods=['POST'])
def start_match(match_id):
    """Start a match"""
    match = Match.query.get_or_404(match_id)

    if match.status != 'scheduled':
        return jsonify({'error': f'Match is already {match.status}'}), 400

    try:
        match.status = 'in_progress'
        db.session.commit()
        return jsonify(match.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@matches_bp.route('/<int:match_id>/score', methods=['POST'])
def update_score(match_id):
    """Update match score"""
    match = Match.query.get_or_404(match_id)
    data = request.get_json()

    if not data or 'home_score' not in data or 'away_score' not in data:
        return jsonify({'error': 'home_score and away_score required'}), 400

    try:
        match.home_score = int(data['home_score'])
        match.away_score = int(data['away_score'])
        db.session.commit()
        return jsonify(match.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@matches_bp.route('/<int:match_id>/finish', methods=['POST'])
def finish_match(match_id):
    """Finish a match and update team records"""
    match = Match.query.get_or_404(match_id)

    if match.status == 'completed':
        return jsonify({'error': 'Match is already completed'}), 400

    try:
        match.status = 'completed'
        match.completed_at = datetime.utcnow()

        if match.home_score > match.away_score:
            match.home_team.wins += 1
            match.away_team.losses += 1
        elif match.away_score > match.home_score:
            match.away_team.wins += 1
            match.home_team.losses += 1

        db.session.commit()
        return jsonify(match.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@matches_bp.route('/<int:match_id>/encounter', methods=['POST'])
def resolve_encounter(match_id):
    """Resolve a tackle encounter during a match"""
    match = Match.query.get_or_404(match_id)
    data = request.get_json()

    if not data or 'carrier_id' not in data or 'defender_ids' not in data:
        return jsonify({'error': 'carrier_id and defender_ids required'}), 400

    carrier = Player.query.get(data['carrier_id'])
    if not carrier:
        return jsonify({'error': 'Carrier not found'}), 404

    defenders = []
    for def_id in data['defender_ids']:
        defender = Player.query.get(def_id)
        if defender:
            defenders.append({'id': defender.id, 'atk': defender.atk})

    result = BlitzMath.resolve_encounter(carrier.end, defenders)

    return jsonify({
        'match_id': match_id,
        'carrier': {'id': carrier.id, 'name': carrier.name},
        'result': result
    }), 200


@matches_bp.route('/<int:match_id>', methods=['DELETE'])
def delete_match(match_id):
    """Delete a match"""
    match = Match.query.get_or_404(match_id)

    try:
        db.session.delete(match)
        db.session.commit()
        return jsonify({'message': 'Match deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

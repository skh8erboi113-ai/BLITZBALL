"""
Analytics and statistics routes
"""
from flask import Blueprint, jsonify
from backend.models import db, Team, Player, Match
from sqlalchemy import func, desc

analytics_bp = Blueprint('analytics', __name__, url_prefix='/analytics')

@analytics_bp.route('/standings', methods=['GET'])
def get_standings():
    """Get league standings sorted by wins"""
    teams = Team.query.all()
    
    standings = []
    for team in teams:
        total_games = team.wins + team.losses
        win_pct = (team.wins / total_games * 100) if total_games > 0 else 0
        
        standings.append({
            'team_id': team.id,
            'team_name': team.name,
            'games_played': total_games,
            'wins': team.wins,
            'losses': team.losses,
            'win_percentage': round(win_pct, 2)
        })
    
    # Sort by wins (descending), then by win percentage
    standings.sort(key=lambda x: (x['wins'], x['win_percentage']), reverse=True)
    
    # Assign ranks
    for i, standing in enumerate(standings, 1):
        standing['rank'] = i
    
    return jsonify(standings), 200

@analytics_bp.route('/top-scorers', methods=['GET'])
def get_top_scorers():
    """Get top players by experience (proxy for goals/performance)"""
    limit = 10
    
    players = Player.query.order_by(
        desc(Player.experience),
        desc(Player.level),
        desc(Player.sht)
    ).limit(limit).all()
    
    scorers = []
    for i, player in enumerate(players, 1):
        scorers.append({
            'rank': i,
            'player_id': player.id,
            'player_name': player.name,
            'team_id': player.team_id,
            'team_name': player.team.name if player.team else None,
            'level': player.level,
            'experience': player.experience,
            'sht_stat': player.sht,
            'position': player.position
        })
    
    return jsonify(scorers), 200

@analytics_bp.route('/player/<int:player_id>/stats', methods=['GET'])
def get_player_stats(player_id):
    """Get detailed player statistics"""
    player = Player.query.get_or_404(player_id)
    
    # Calculate rankings
    all_players = Player.query.all()
    exp_rank = sorted(all_players, key=lambda p: p.experience, reverse=True)
    lvl_rank = sorted(all_players, key=lambda p: p.level, reverse=True)
    sht_rank = sorted(all_players, key=lambda p: p.sht, reverse=True)
    
    return jsonify({
        'player': player.to_dict(include_team=True),
        'rankings': {
            'experience_rank': exp_rank.index(player) + 1 if player in exp_rank else None,
            'level_rank': lvl_rank.index(player) + 1 if player in lvl_rank else None,
            'shooting_rank': sht_rank.index(player) + 1 if player in sht_rank else None,
            'total_players': len(all_players)
        }
    }), 200

@analytics_bp.route('/team/<int:team_id>/stats', methods=['GET'])
def get_team_stats(team_id):
    """Get detailed team statistics"""
    team = Team.query.get_or_404(team_id)
    roster = list(team.players.all())
    
    if not roster:
        avg_stats = {}
        total_exp = 0
        avg_level = 0
    else:
        avg_stats = {
            'avg_hp': round(sum(p.hp for p in roster) / len(roster), 1),
            'avg_spd': round(sum(p.spd for p in roster) / len(roster), 1),
            'avg_end': round(sum(p.end for p in roster) / len(roster), 1),
            'avg_atk': round(sum(p.atk for p in roster) / len(roster), 1),
            'avg_pas': round(sum(p.pas for p in roster) / len(roster), 1),
            'avg_sht': round(sum(p.sht for p in roster) / len(roster), 1),
            'avg_bli': round(sum(p.bli for p in roster) / len(roster), 1),
            'avg_rch': round(sum(p.rch for p in roster) / len(roster), 1)
        }
        total_exp = sum(p.experience for p in roster)
        avg_level = round(sum(p.level for p in roster) / len(roster), 1)
    
    # Get recent matches
    recent_matches = Match.query.filter(
        (Match.home_team_id == team_id) | (Match.away_team_id == team_id)
    ).order_by(desc(Match.match_date)).limit(5).all()
    
    return jsonify({
        'team': team.to_dict(include_roster=True),
        'roster_size': len(roster),
        'average_stats': avg_stats,
        'total_experience': total_exp,
        'average_level': avg_level,
        'recent_matches': [m.to_dict() for m in recent_matches]
    }), 200

@analytics_bp.route('/league/overview', methods=['GET'])
def get_league_overview():
    """Get overall league statistics"""
    total_teams = Team.query.count()
    total_players = Player.query.count()
    total_matches = Match.query.count()
    completed_matches = Match.query.filter_by(status='completed').count()
    
    # Average stats across all players
    all_players = Player.query.all()
    if all_players:
        league_avg_stats = {
            'avg_level': round(sum(p.level for p in all_players) / len(all_players), 1),
            'avg_hp': round(sum(p.hp for p in all_players) / len(all_players), 1),
            'avg_sht': round(sum(p.sht for p in all_players) / len(all_players), 1),
            'total_experience': sum(p.experience for p in all_players)
        }
    else:
        league_avg_stats = {}
    
    return jsonify({
        'total_teams': total_teams,
        'total_players': total_players,
        'total_matches': total_matches,
        'completed_matches': completed_matches,
        'scheduled_matches': total_matches - completed_matches,
        'league_averages': league_avg_stats
    }), 200

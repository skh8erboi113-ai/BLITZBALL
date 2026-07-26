from flask import Blueprint

bp = Blueprint('api', __name__, url_prefix='/api')

from backend.routes import teams, players, matches

bp.register_blueprint(teams.bp)
bp.register_blueprint(players.bp)
bp.register_blueprint(matches.bp)

"""
API Routes Blueprint Registration
"""
from flask import Blueprint

# Create main API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import and register sub-blueprints
from backend.routes.teams import teams_bp
from backend.routes.players import players_bp
from backend.routes.matches import matches_bp
from backend.routes.simulation import simulation_bp
from backend.routes.builder import builder_bp
from backend.routes.analytics import analytics_bp

api_bp.register_blueprint(teams_bp)
api_bp.register_blueprint(players_bp)
api_bp.register_blueprint(matches_bp)
api_bp.register_blueprint(simulation_bp)
api_bp.register_blueprint(builder_bp)
api_bp.register_blueprint(analytics_bp)

"""
Main Flask application for Blitzball League Manager
"""
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import config
from backend.models import db
import os

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    from backend.routes import api_bp
    app.register_blueprint(api_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'name': 'Blitzball League Manager API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'teams': '/api/teams',
                'players': '/api/players',
                'matches': '/api/matches',
                'simulation': '/api/simulation',
                'builder': '/api/builder',
                'analytics': '/api/analytics'
            }
        })
    
    # Health check
    @app.route('/health')
    def health():
        return jsonify({'status': 'ok'}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)

/**
 * Team Builder UI
 * Auto-generate teams with balanced rosters
 */

class TeamBuilderUI {
    /**
     * Show team builder modal
     */
    static showBuilder() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'team-builder-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>🏗️ Auto Team Builder</h2>
                
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
                    Automatically generate a complete team with 8 balanced players (3 Forwards, 2 Midfielders, 2 Defenders, 1 Goalkeeper).
                </p>
                
                <form id="team-builder-form">
                    <div class="form-group">
                        <label for="builder-team-name">Team Name *</label>
                        <input type="text" id="builder-team-name" required placeholder="Enter team name">
                    </div>
                    
                    <div class="form-group">
                        <label for="builder-city">City</label>
                        <input type="text" id="builder-city" placeholder="Enter city (optional)">
                    </div>
                    
                    <div class="form-group">
                        <label for="builder-coach">Coach</label>
                        <input type="text" id="builder-coach" placeholder="Enter coach name (optional)">
                    </div>
                    
                    <div class="form-group">
                        <label for="builder-skill">Skill Level</label>
                        <select id="builder-skill">
                            <option value="rookie">🌱 Rookie (Stats: 5-15)</option>
                            <option value="medium" selected>⚡ Medium (Stats: 10-25)</option>
                            <option value="veteran">⭐ Veteran (Stats: 20-40)</option>
                            <option value="champion">🏆 Champion (Stats: 35-60)</option>
                        </select>
                    </div>
                    
                    <div style="background: var(--light); padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <strong>What you'll get:</strong>
                        <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                            <li>3 Forwards (high SHT & SPD)</li>
                            <li>2 Midfielders (high PAS & END)</li>
                            <li>2 Defenders (high ATK & BLI)</li>
                            <li>1 Goalkeeper (high BLI & RCH)</li>
                        </ul>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        🏗️ Build Team
                    </button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('team-builder-form').addEventListener('submit', (e) => {
            this.submitBuilder(e);
        });
    }
    
    /**
     * Submit team builder form
     */
    static async submitBuilder(e) {
        e.preventDefault();
        
        const name = document.getElementById('builder-team-name').value.trim();
        const city = document.getElementById('builder-city').value.trim();
        const coach = document.getElementById('builder-coach').value.trim();
        const skillLevel = document.getElementById('builder-skill').value;
        
        try {
            UIManager.showToast('🏗️ Building team...', 'info');
            
            const result = await APIClient.buildTeam(name, city, coach, skillLevel);
            
            UIManager.showToast(`✅ Team "${result.team.name}" created with ${result.roster_count} players!`, 'success');
            document.getElementById('team-builder-modal').remove();
            
            UIManager.loadTeams();
            UIManager.loadPlayers();
        } catch (error) {
            UIManager.showToast(`❌ Failed to build team: ${error.message}`, 'error');
        }
    }
    
    /**
     * Seed the league with FFX teams
     */
    static async seedLeague() {
        const confirmed = confirm(
            '🌱 This will create all 6 classic FFX Blitzball teams with full rosters:\n\n' +
            '• Besaid Aurochs\n' +
            '• Luca Goers\n' +
            '• Kilika Beasts\n' +
            '• Al Bhed Psyches\n' +
            '• Ronso Fangs\n' +
            '• Guado Glories\n\n' +
            'Continue?'
        );
        
        if (!confirmed) return;
        
        try {
            UIManager.showToast('🌱 Seeding league...', 'info');
            
            const result = await APIClient.seedLeague();
            
            UIManager.showToast(`✅ ${result.message}`, 'success');
            UIManager.loadTeams();
            UIManager.loadPlayers();
            UIManager.loadStandings();
        } catch (error) {
            UIManager.showToast(`❌ Failed to seed league: ${error.message}`, 'error');
        }
    }
}

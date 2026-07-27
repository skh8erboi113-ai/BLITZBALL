/**
 * Team Builder UI
 */

class TeamBuilderUI {
    static showBuilder() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'team-builder-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>🏗️ Team Builder</h2>
                
                <form id="team-builder-form">
                    <div class="form-group">
                        <label>Team Name *</label>
                        <input type="text" id="builder-team-name" required>
                    </div>
                    
                    <div class="form-group">
                        <label>City</label>
                        <input type="text" id="builder-city">
                    </div>
                    
                    <div class="form-group">
                        <label>Coach</label>
                        <input type="text" id="builder-coach">
                    </div>
                    
                    <div class="form-group">
                        <label>Skill Level</label>
                        <select id="builder-skill">
                            <option value="rookie">Rookie (Stats: 5-15)</option>
                            <option value="medium" selected>Medium (Stats: 10-25)</option>
                            <option value="veteran">Veteran (Stats: 20-40)</option>
                            <option value="champion">Champion (Stats: 35-60)</option>
                        </select>
                    </div>
                    
                    <p style="color: #7f8c8d; font-size: 14px; margin: 15px 0;">
                        This will create a full team with 8 players (3 Forwards, 2 Midfielders, 2 Defenders, 1 Goalkeeper).
                    </p>
                    
                    <button type="submit" class="btn btn-primary">Build Team</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('team-builder-form').addEventListener('submit', (e) => {
            this.submitBuilder(e);
        });
    }
    
    static async submitBuilder(e) {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('builder-team-name').value,
            city: document.getElementById('builder-city').value,
            coach: document.getElementById('builder-coach').value,
            skill_level: document.getElementById('builder-skill').value
        };
        
        try {
            UIManager.showToast('Building team...', 'info');
            
            const result = await fetch(`${API_URL}/builder/team`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(r => r.json());
            
            UIManager.showToast(`Team "${result.team.name}" created with ${result.roster_count} players!`, 'success');
            document.getElementById('team-builder-modal').remove();
            UIManager.loadTeams();
            UIManager.loadPlayers();
        } catch (error) {
            UIManager.showToast('Failed to build team: ' + error.message, 'error');
        }
    }
    
    static async seedLeague() {
        if (!confirm('This will create all 6 FFX Blitzball teams with full rosters. Continue?')) {
            return;
        }
        
        try {
            UIManager.showToast('Seeding league...', 'info');
            
            const result = await fetch(`${API_URL}/builder/seed-league`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(r => r.json());
            
            UIManager.showToast(result.message, 'success');
            UIManager.loadTeams();
            UIManager.loadPlayers();
        } catch (error) {
            UIManager.showToast('Failed to seed league: ' + error.message, 'error');
        }
    }
}

/**
 * Match Simulation UI
 */

class SimulationManager {
    static async simulateMatch(matchId) {
        try {
            UIManager.showToast('Starting match simulation...', 'info');
            
            const result = await fetch(`${API_URL}/simulation/match/${matchId}/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(r => r.json());
            
            this.displayMatchResult(result);
            UIManager.loadMatches();
            
            return result;
        } catch (error) {
            UIManager.showToast('Simulation failed: ' + error.message, 'error');
            throw error;
        }
    }
    
    static displayMatchResult(result) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>Match Complete!</h2>
                
                <div style="text-align: center; margin: 30px 0;">
                    <h1 style="font-size: 48px; color: var(--primary);">
                        ${result.final_score.home} - ${result.final_score.away}
                    </h1>
                    <p style="font-size: 20px; font-weight: 600;">
                        ${result.winner.result === 'draw' ? 'DRAW' : result.winner.winner_name + ' WINS!'}
                    </p>
                </div>
                
                <h3>Match Events</h3>
                <div class="events-timeline" style="max-height: 400px; overflow-y: auto;">
                    ${this.renderEvents(result.events)}
                </div>
                
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    static renderEvents(events) {
        return events.map(event => {
            const icons = {
                'goal': '⚽',
                'save': '🧤',
                'tackle': '🛡️',
                'breakthrough': '⚡',
                'halftime': '⏸️',
                'final_whistle': '🏁'
            };
            
            const icon = icons[event.type] || '📋';
            const minute = event.metadata.minute ? `${event.metadata.minute}'` : '';
            
            return `
                <div class="event-item" style="padding: 10px; border-left: 3px solid var(--primary); margin: 10px 0; background: var(--light);">
                    <span style="font-size: 20px; margin-right: 10px;">${icon}</span>
                    <span style="font-weight: 600;">${minute}</span>
                    <span>${event.description}</span>
                </div>
            `;
        }).join('');
    }
}

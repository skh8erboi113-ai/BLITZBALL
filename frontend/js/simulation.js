/**
 * Match Simulation UI Manager
 * Handles AI match simulation and result display
 */

class SimulationManager {
    /**
     * Run AI simulation for a match
     */
    static async simulateMatch(matchId) {
        try {
            UIManager.showToast('⚙️ Starting match simulation...', 'info');
            
            const result = await APIClient.simulateMatch(matchId);
            
            this.displayMatchResult(result);
            UIManager.loadMatches();
            UIManager.loadStandings();
            
            UIManager.showToast('✅ Match simulation completed!', 'success');
            return result;
        } catch (error) {
            UIManager.showToast(`❌ Simulation failed: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Display match result in a modal
     */
    static displayMatchResult(result) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content roster-modal-wide">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>🏁 Match Complete!</h2>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background: var(--light); border-radius: 8px;">
                    <div style="font-size: 18px; color: var(--dark); margin-bottom: 10px;">
                        ${result.home_team} vs ${result.away_team}
                    </div>
                    <div style="font-size: 48px; font-weight: 700; color: var(--primary); margin: 10px 0;">
                        ${result.final_score.home} - ${result.final_score.away}
                    </div>
                    <div style="font-size: 20px; font-weight: 600; color: var(--secondary); margin-top: 10px;">
                        ${this._getWinnerText(result.winner)}
                    </div>
                </div>
                
                <h3>📋 Match Events</h3>
                <div class="events-timeline" style="max-height: 400px; overflow-y: auto; margin-top: 15px;">
                    ${this.renderEvents(result.events)}
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Get winner text
     */
    static _getWinnerText(winner) {
        if (winner.result === 'draw') {
            return 'DRAW';
        }
        return `${winner.winner} WINS!`;
    }
    
    /**
     * Render match events as timeline
     */
    static renderEvents(events) {
        if (!events || events.length === 0) {
            return '<p class="text-muted text-center">No events recorded</p>';
        }

        const eventIcons = {
            'goal': '⚽',
            'save': '🧤',
            'tackle': '🛡️',
            'breakthrough': '⚡',
            'halftime': '⏸️',
            'final_whistle': '🏁'
        };
        
        const eventColors = {
            'goal': '#2ecc71',
            'save': '#3498db',
            'tackle': '#e67e22',
            'breakthrough': '#9b59b6',
            'halftime': '#95a5a6',
            'final_whistle': '#34495e'
        };
        
        return events.map(event => {
            const icon = eventIcons[event.type] || '📋';
            const color = eventColors[event.type] || '#3498db';
            const minute = event.metadata.minute ? `${event.metadata.minute}'` : '';
            
            return `
                <div class="event-item" style="
                    padding: 12px;
                    border-left: 4px solid ${color};
                    margin: 10px 0;
                    background: var(--light);
                    border-radius: 4px;
                    transition: all 0.3s;
                ">
                    <span style="font-size: 24px; margin-right: 12px;">${icon}</span>
                    ${minute ? `<span style="font-weight: 600; color: ${color}; margin-right: 8px;">${minute}</span>` : ''}
                    <span>${event.description}</span>
                </div>
            `;
        }).join('');
    }
}

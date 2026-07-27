/**
 * UI Manager - Handles all UI interactions and data display
 * Production-ready with comprehensive error handling
 */

class UIManager {
    static currentMatchFilter = 'all';
    
    /**
     * Initialize UI
     */
    static init() {
        this.setupNavigation();
        this.setupModals();
        this.setupEventListeners();
        this.loadData();
    }

    // ========== NAVIGATION ==========

    static setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });
    }

    static switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionName) {
                link.classList.add('active');
            }
        });
        
        // Show selected section
        const section = document.getElementById(`${sectionName}-section`);
        if (section) {
            section.classList.add('active');
        }
        
        // Load data for the section
        if (sectionName === 'teams') this.loadTeams();
        else if (sectionName === 'players') this.loadPlayers();
        else if (sectionName === 'matches') this.loadMatches();
        else if (sectionName === 'standings') this.loadStandings();
    }

    // ========== MODALS ==========

    static setupModals() {
        // Team modal
        document.getElementById('create-team-btn')?.addEventListener('click', () => this.openTeamModal());
        document.getElementById('team-form')?.addEventListener('submit', (e) => this.submitTeamForm(e));

        // Player modal
        document.getElementById('create-player-btn')?.addEventListener('click', () => this.openPlayerModal());
        document.getElementById('player-form')?.addEventListener('submit', (e) => this.submitPlayerForm(e));

        // Match modal
        document.getElementById('create-match-btn')?.addEventListener('click', () => this.openMatchModal());
        document.getElementById('match-form')?.addEventListener('submit', (e) => this.submitMatchForm(e));

        // Close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal')?.classList.remove('show');
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }

    static openTeamModal(teamId = null) {
        const modal = document.getElementById('team-modal');
        const form = document.getElementById('team-form');
        const title = document.getElementById('team-modal-title');

        if (teamId) {
            title.textContent = 'Edit Team';
            APIClient.getTeam(teamId).then(team => {
                document.getElementById('team-id').value = team.id;
                document.getElementById('team-name').value = team.name;
                document.getElementById('team-city').value = team.city || '';
                document.getElementById('team-coach').value = team.coach || '';
            }).catch(error => {
                this.showToast(`Failed to load team: ${error.message}`, 'error');
            });
        } else {
            title.textContent = 'Create Team';
            form.reset();
            document.getElementById('team-id').value = '';
        }

        modal.classList.add('show');
    }

    static async submitTeamForm(e) {
        e.preventDefault();
        
        const teamId = document.getElementById('team-id').value;
        const data = {
            name: document.getElementById('team-name').value.trim(),
            city: document.getElementById('team-city').value.trim(),
            coach: document.getElementById('team-coach').value.trim()
        };

        try {
            if (teamId) {
                await APIClient.updateTeam(teamId, data);
                this.showToast('✅ Team updated successfully', 'success');
            } else {
                await APIClient.createTeam(data.name, data.city, data.coach);
                this.showToast('✅ Team created successfully', 'success');
            }
            
            document.getElementById('team-modal').classList.remove('show');
            this.loadTeams();
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    static openPlayerModal(playerId = null) {
        const modal = document.getElementById('player-modal');
        const form = document.getElementById('player-form');
        const title = document.getElementById('player-modal-title');

        // Populate team dropdown
        APIClient.getAllTeams().then(teams => {
            const select = document.getElementById('player-team');
            select.innerHTML = '<option value="">Select a team...</option>';
            teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                select.appendChild(option);
            });
        });

        if (playerId) {
            title.textContent = 'Edit Player';
            APIClient.getPlayer(playerId).then(player => {
                document.getElementById('player-id').value = player.id;
                document.getElementById('player-name').value = player.name;
                document.getElementById('player-team').value = player.team_id;
                document.getElementById('player-position').value = player.position;
                document.getElementById('player-level').value = player.level;
                
                // Set stats
                document.getElementById('stat-hp').value = player.stats.HP;
                document.getElementById('stat-spd').value = player.stats.SPD;
                document.getElementById('stat-end').value = player.stats.END;
                document.getElementById('stat-atk').value = player.stats.ATK;
                document.getElementById('stat-pas').value = player.stats.PAS;
                document.getElementById('stat-sht').value = player.stats.SHT;
                document.getElementById('stat-bli').value = player.stats.BLI;
                document.getElementById('stat-rch').value = player.stats.RCH;
            }).catch(error => {
                this.showToast(`Failed to load player: ${error.message}`, 'error');
            });
        } else {
            title.textContent = 'Create Player';
            form.reset();
            document.getElementById('player-id').value = '';
        }

        modal.classList.add('show');
    }

    static async submitPlayerForm(e) {
        e.preventDefault();
        
        const playerId = document.getElementById('player-id').value;
        const stats = {
            HP: parseInt(document.getElementById('stat-hp').value),
            SPD: parseInt(document.getElementById('stat-spd').value),
            END: parseInt(document.getElementById('stat-end').value),
            ATK: parseInt(document.getElementById('stat-atk').value),
            PAS: parseInt(document.getElementById('stat-pas').value),
            SHT: parseInt(document.getElementById('stat-sht').value),
            BLI: parseInt(document.getElementById('stat-bli').value),
            RCH: parseInt(document.getElementById('stat-rch').value)
        };

        try {
            if (playerId) {
                await APIClient.updatePlayer(playerId, {
                    name: document.getElementById('player-name').value.trim(),
                    position: document.getElementById('player-position').value,
                    ...stats
                });
                this.showToast('✅ Player updated successfully', 'success');
            } else {
                await APIClient.createPlayer(
                    document.getElementById('player-name').value.trim(),
                    parseInt(document.getElementById('player-team').value),
                    document.getElementById('player-position').value,
                    stats
                );
                this.showToast('✅ Player created successfully', 'success');
            }
            
            document.getElementById('player-modal').classList.remove('show');
            this.loadPlayers();
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    static openMatchModal(matchId = null) {
        const modal = document.getElementById('match-modal');
        const form = document.getElementById('match-form');
        const title = document.getElementById('match-modal-title');

        // Populate team dropdowns
        APIClient.getAllTeams().then(teams => {
            ['match-home-team', 'match-away-team'].forEach(selectId => {
                const select = document.getElementById(selectId);
                select.innerHTML = '<option value="">Select team...</option>';
                teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team.id;
                    option.textContent = team.name;
                    select.appendChild(option);
                });
            });
        });

        if (matchId) {
            title.textContent = 'Edit Match';
            // Matches can't be edited in this version, only created
        } else {
            title.textContent = 'Schedule Match';
            form.reset();
            document.getElementById('match-id').value = '';
            
            // Set default date to now
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('match-date').value = now.toISOString().slice(0, 16);
        }

        modal.classList.add('show');
    }

    static async submitMatchForm(e) {
        e.preventDefault();
        
        const homeTeamId = parseInt(document.getElementById('match-home-team').value);
        const awayTeamId = parseInt(document.getElementById('match-away-team').value);
        const matchDate = document.getElementById('match-date').value;

        if (homeTeamId === awayTeamId) {
            this.showToast('❌ A team cannot play against itself', 'error');
            return;
        }

        try {
            await APIClient.createMatch(homeTeamId, awayTeamId, matchDate);
            this.showToast('✅ Match scheduled successfully', 'success');
            document.getElementById('match-modal').classList.remove('show');
            this.loadMatches();
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    // ========== DATA LOADING ==========

    static async loadData() {
        await Promise.all([
            this.loadTeams(),
            this.loadPlayers(),
            this.loadMatches(),
            this.loadStandings()
        ]);
    }

    static async loadTeams() {
        try {
            const teams = await APIClient.getAllTeams();
            const container = document.getElementById('teams-list');
            
            if (!container) return;
            
            container.innerHTML = '';

            if (teams.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                        <p style="color: #999; font-size: 18px; margin-bottom: 20px;">No teams yet. Create one or seed the league!</p>
                        <button class="btn btn-primary" onclick="TeamBuilderUI.showBuilder()">🏗️ Build Team</button>
                        <button class="btn btn-secondary" onclick="TeamBuilderUI.seedLeague()">🌱 Seed League</button>
                    </div>
                `;
                return;
            }

            teams.forEach(team => {
                const card = this.createTeamCard(team);
                container.appendChild(card);
            });
        } catch (error) {
            this.showToast(`Failed to load teams: ${error.message}`, 'error');
        }
    }

    static createTeamCard(team) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${this.escapeHtml(team.name)}</div>
                    <div class="card-subtitle">${this.escapeHtml(team.city || 'Unknown City')}</div>
                </div>
            </div>
            <div class="team-record">
                <strong>Record:</strong> ${team.record} (${team.win_percentage}%)
            </div>
            <div class="team-record">
                <strong>Coach:</strong> ${this.escapeHtml(team.coach || 'N/A')}
            </div>
            <div class="team-record" style="color: var(--text-muted); font-size: 12px;">
                Games Played: ${team.games_played}
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-small" onclick="UIManager.openTeamModal(${team.id})">Edit</button>
                <button class="btn btn-secondary btn-small" onclick="UIManager.viewRoster(${team.id})">Roster</button>
                <button class="btn btn-danger btn-small" onclick="UIManager.deleteTeam(${team.id})">Delete</button>
            </div>
        `;
        return card;
    }

    static async viewRoster(teamId) {
        try {
            const roster = await APIClient.getRoster(teamId);
            
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.innerHTML = `
                <div class="modal-content roster-modal-wide">
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    <h2>${this.escapeHtml(roster.team_name)} Roster</h2>
                    <p style="color: var(--text-muted); margin-bottom: 20px;">
                        ${roster.roster_count} players
                    </p>
                    ${this.renderRosterTable(roster.roster)}
                </div>
            `;
            
            document.body.appendChild(modal);
        } catch (error) {
            this.showToast(`Failed to load roster: ${error.message}`, 'error');
        }
    }

    static renderRosterTable(roster) {
        if (roster.length === 0) {
            return '<p class="text-center text-muted">No players on this team</p>';
        }

        return `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Pos</th>
                        <th>Lvl</th>
                        <th>HP</th>
                        <th>SPD</th>
                        <th>END</th>
                        <th>ATK</th>
                        <th>SHT</th>
                    </tr>
                </thead>
                <tbody>
                    ${roster.map(p => `
                        <tr>
                            <td><strong>${this.escapeHtml(p.name)}</strong></td>
                            <td>${this.escapeHtml(p.position)}</td>
                            <td>${p.level}</td>
                            <td>${p.stats.HP}</td>
                            <td>${p.stats.SPD}</td>
                            <td>${p.stats.END}</td>
                            <td>${p.stats.ATK}</td>
                            <td>${p.stats.SHT}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    static async deleteTeam(teamId) {
        if (!confirm('Are you sure you want to delete this team? All players will be removed.')) {
            return;
        }

        try {
            await APIClient.deleteTeam(teamId);
            this.showToast('✅ Team deleted successfully', 'success');
            this.loadTeams();
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    static async loadPlayers() {
        try {
            const players = await APIClient.getAllPlayers();
            const container = document.getElementById('players-list');
            
            if (!container) return;
            
            container.innerHTML = '';

            if (players.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
                        <p style="font-size: 18px;">No players yet. Create teams first!</p>
                    </div>
                `;
                return;
            }

            players.forEach(player => {
                const card = this.createPlayerCard(player);
                container.appendChild(card);
            });
        } catch (error) {
            this.showToast(`Failed to load players: ${error.message}`, 'error');
        }
    }

    static createPlayerCard(player) {
        const stats = player.stats;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${this.escapeHtml(player.name)}</div>
                    <div class="card-subtitle">
                        Level ${player.level} • ${this.escapeHtml(player.position)}
                        ${player.team_name ? `• ${this.escapeHtml(player.team_name)}` : ''}
                    </div>
                </div>
            </div>
            <div class="stats-display">
                <div class="stat-item">
                    <div class="stat-label">HP</div>
                    <div class="stat-value">${stats.HP}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">SPD</div>
                    <div class="stat-value">${stats.SPD}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">END</div>
                    <div class="stat-value">${stats.END}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">ATK</div>
                    <div class="stat-value">${stats.ATK}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">PAS</div>
                    <div class="stat-value">${stats.PAS}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">SHT</div>
                    <div class="stat-value">${stats.SHT}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">BLI</div>
                    <div class="stat-value">${stats.BLI}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">RCH</div>
                    <div class="stat-value">${stats.RCH}</div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-small" onclick="UIManager.openPlayerModal(${player.id})">Edit</button>
                <button class="btn btn-secondary btn-small" onclick="UIManager.levelUpPlayer(${player.id})">⬆ Level Up</button>
                <button class="btn btn-danger btn-small" onclick="UIManager.deletePlayer(${player.id})">Release</button>
            </div>
        `;
        return card;
    }

    static async levelUpPlayer(playerId) {
        try {
            const player = await APIClient.getPlayer(playerId);
            
            const deltas = {
                'HP': parseInt(prompt(`Increase HP (current: ${player.stats.HP}):`, '10') || '0'),
                'SPD': parseInt(prompt(`Increase SPD (current: ${player.stats.SPD}):`, '2') || '0'),
                'END': parseInt(prompt(`Increase END (current: ${player.stats.END}):`, '2') || '0'),
                'ATK': parseInt(prompt(`Increase ATK (current: ${player.stats.ATK}):`, '2') || '0'),
                'PAS': parseInt(prompt(`Increase PAS (current: ${player.stats.PAS}):`, '2') || '0'),
                'SHT': parseInt(prompt(`Increase SHT (current: ${player.stats.SHT}):`, '2') || '0'),
                'BLI': parseInt(prompt(`Increase BLI (current: ${player.stats.BLI}):`, '1') || '0'),
                'RCH': parseInt(prompt(`Increase RCH (current: ${player.stats.RCH}):`, '1') || '0')
            };

            await APIClient.levelUpPlayer(playerId, deltas);
            this.showToast(`✅ ${player.name} leveled up!`, 'success');
            this.loadPlayers();
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    static async deletePlayer(playerId) {
        if (!confirm('Are you sure you want to release this player?')) {
            return;
        }

        try {
            await APIClient.deletePlayer(playerId);
            this.showToast('✅ Player released successfully', 'success');
            this.loadPlayers();
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    static async loadMatches() {
        try {
            const matches = await APIClient.getAllMatches(this.currentMatchFilter === 'all' ? null : this.currentMatchFilter);
            const container = document.getElementById('matches-list');
            
            if (!container) return;
            
            container.innerHTML = '';

            if (matches.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
                        <p style="font-size: 18px;">No matches ${this.currentMatchFilter !== 'all' ? this.currentMatchFilter : 'yet'}.</p>
                    </div>
                `;
                return;
            }

            matches.forEach(match => {
                const card = this.createMatchCard(match);
                container.appendChild(card);
            });
        } catch (error) {
            this.showToast(`Failed to load matches: ${error.message}`, 'error');
        }
    }

    static createMatchCard(match) {
        const card = document.createElement('div');
        card.className = 'card';
        const date = new Date(match.match_date).toLocaleString();
        
        const statusColors = {
            'scheduled': '#3498db',
            'in_progress': '#f39c12',
            'completed': '#2ecc71'
        };
        
        card.innerHTML = `
            <div class="card-header">
                <div style="flex: 1;">
                    <div class="card-title">${this.escapeHtml(match.home_team_name)} vs ${this.escapeHtml(match.away_team_name)}</div>
                    <div class="card-subtitle">${date}</div>
                </div>
                <div style="padding: 5px 10px; background: ${statusColors[match.status]}; color: white; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                    ${match.status.replace('_', ' ')}
                </div>
            </div>
            <div style="text-align: center; font-size: 32px; font-weight: 700; margin: 20px 0; color: var(--primary);">
                ${match.home_score} - ${match.away_score}
            </div>
            ${match.winner ? `<div style="text-align: center; color: var(--secondary); font-weight: 600; margin-bottom: 15px;">Winner: ${match.winner === 'draw' ? 'Draw' : match.winner === 'home' ? match.home_team_name : match.away_team_name}</div>` : ''}
            <div class="card-actions">
                ${match.status === 'scheduled' ? `
                    <button class="btn btn-primary btn-small" onclick="UIManager.startMatch(${match.id})">▶ Start</button>
                    <button class="btn btn-secondary btn-small" onclick="SimulationManager.simulateMatch(${match.id})">🤖 Simulate</button>
                ` : ''}
                ${match.status === 'in_progress' ? `
                    <button class="btn btn-secondary btn-small" onclick="UIManager.finishMatch(${match.id})">🏁 Finish</button>
                ` : ''}
                <button class="btn btn-danger btn-small" onclick="UIManager.deleteMatch(${match.id})">Delete</button>
            </div>
        `;
        return card;
    }

    static filterMatches(status) {
        this.currentMatchFilter = status;
        this.loadMatches();
    }

    static async startMatch(matchId) {
        try {
            await APIClient.startMatch(matchId);
            this.showToast('✅ Match started', 'success');
            this.loadMatches();
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    static async finishMatch(matchId) {
        try {
            const match = await APIClient.getMatch(matchId);
            const homeScore = parseInt(prompt(`Home team (${match.home_team_name}) final score:`, match.home_score) || match.home_score);
            const awayScore = parseInt(prompt(`Away team (${match.away_team_name}) final score:`, match.away_score) || match.away_score);

            if (!isNaN(homeScore) && !isNaN(awayScore)) {
                await APIClient.updateScore(matchId, homeScore, awayScore);
                await APIClient.finishMatch(matchId);
                this.showToast('✅ Match finished', 'success');
                this.loadMatches();
                this.loadStandings();
            }
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    static async deleteMatch(matchId) {
        if (!confirm('Delete this match?')) return;

        try {
            await APIClient.deleteMatch(matchId);
            this.showToast('✅ Match deleted', 'success');
            this.loadMatches();
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    static async loadStandings() {
        try {
            const standings = await APIClient.getStandings();
            const tbody = document.getElementById('standings-tbody');
            
            if (!tbody) return;
            
            if (standings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No teams yet</td></tr>';
                return;
            }

            tbody.innerHTML = standings.map(s => `
                <tr>
                    <td><strong>${s.rank}</strong></td>
                    <td>${this.escapeHtml(s.team_name)}</td>
                    <td>${s.games_played}</td>
                    <td style="color: var(--secondary); font-weight: 600;">${s.wins}</td>
                    <td style="color: var(--danger);">${s.losses}</td>
                    <td><strong>${s.win_percentage}%</strong></td>
                </tr>
            `).join('');
        } catch (error) {
            this.showToast(`Failed to load standings: ${error.message}`, 'error');
        }
    }

    static async showTopScorers() {
        try {
            const scorers = await APIClient.getTopScorers();
            
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    <h2>🏆 Top Scorers</h2>
                    <table class="standings-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Team</th>
                                <th>Lvl</th>
                                <th>XP</th>
                                <th>SHT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scorers.map(s => `
                                <tr>
                                    <td><strong>${s.rank}</strong></td>
                                    <td>${this.escapeHtml(s.player_name)}</td>
                                    <td>${this.escapeHtml(s.team_name || 'N/A')}</td>
                                    <td>${s.level}</td>
                                    <td>${s.experience}</td>
                                    <td style="color: var(--primary); font-weight: 600;">${s.sht_stat}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            document.body.appendChild(modal);
        } catch (error) {
            this.showToast(`Failed to load top scorers: ${error.message}`, 'error');
        }
    }

    // ========== EVENT LISTENERS ==========

    static setupEventListeners() {
        // Player search
        const searchInput = document.getElementById('player-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPlayers(e.target.value);
            });
        }
    }

    static filterPlayers(searchTerm) {
        const cards = document.querySelectorAll('#players-list .card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(card => {
            const name = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const visible = name.includes(term);
            card.style.display = visible ? '' : 'none';
        });
    }

    // ========== UTILITIES ==========

    static showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

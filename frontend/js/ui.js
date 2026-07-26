/**
 * UI Manager - Handles all UI interactions
 */

class UIManager {
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
                this.switchSection(section);
            });
        });
    }

    static switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionName) link.classList.add('active');
        });
        // Show selected section
        document.getElementById(`${sectionName}-section`).classList.add('active');
        // Load data if needed
        if (sectionName === 'teams') this.loadTeams();
        else if (sectionName === 'players') this.loadPlayers();
        else if (sectionName === 'matches') this.loadMatches();
    }

    // ========== MODALS ==========

    static setupModals() {
        // Team modal
        document.getElementById('create-team-btn').addEventListener('click', () => this.openTeamModal());
        document.getElementById('team-form').addEventListener('submit', (e) => this.submitTeamForm(e));

        // Player modal
        document.getElementById('create-player-btn').addEventListener('click', () => this.openPlayerModal());
        document.getElementById('player-form').addEventListener('submit', (e) => this.submitPlayerForm(e));

        // Match modal
        document.getElementById('create-match-btn').addEventListener('click', () => this.openMatchModal());
        document.getElementById('match-form').addEventListener('submit', (e) => this.submitMatchForm(e));

        // Close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });

        // Click outside modal
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('show');
            });
        });
    }

    static openTeamModal(teamId = null) {
        const modal = document.getElementById('team-modal');
        const form = document.getElementById('team-form');
        const title = document.getElementById('team-modal-title');

        if (teamId) {
            title.textContent = 'Edit Team';
            // Load team data
            APIClient.getTeam(teamId).then(team => {
                document.getElementById('team-id').value = team.id;
                document.getElementById('team-name').value = team.name;
                document.getElementById('team-city').value = team.city || '';
                document.getElementById('team-coach').value = team.coach || '';
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
            name: document.getElementById('team-name').value,
            city: document.getElementById('team-city').value,
            coach: document.getElementById('team-coach').value
        };

        try {
            if (teamId) {
                await APIClient.updateTeam(teamId, data);
                this.showToast('Team updated successfully', 'success');
            } else {
                await APIClient.createTeam(data.name, data.city, data.coach);
                this.showToast('Team created successfully', 'success');
            }
            document.getElementById('team-modal').classList.remove('show');
            this.loadTeams();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    static openPlayerModal(playerId = null) {
        const modal = document.getElementById('player-modal');
        const form = document.getElementById('player-form');
        const title = document.getElementById('player-modal-title');

        // Populate team dropdown
        APIClient.getAllTeams().then(teams => {
            const select = document.getElementById('player-team');
            select.innerHTML = '';
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
                document.getElementById('stat-hp').value = player.stats.HP;
                document.getElementById('stat-spd').value = player.stats.SPD;
                document.getElementById('stat-end').value = player.stats.END;
                document.getElementById('stat-atk').value = player.stats.ATK;
                document.getElementById('stat-pas').value = player.stats.PAS;
                document.getElementById('stat-sht').value = player.stats.SHT;
                document.getElementById('stat-bli').value = player.stats.BLI;
                document.getElementById('stat-rch').value = player.stats.RCH;
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
                    name: document.getElementById('player-name').value,
                    position: document.getElementById('player-position').value,
                    hp: stats.HP,
                    spd: stats.SPD,
                    end: stats.END,
                    atk: stats.ATK,
                    pas: stats.PAS,
                    sht: stats.SHT,
                    bli: stats.BLI,
                    rch: stats.RCH
                });
                this.showToast('Player updated successfully', 'success');
            } else {
                await APIClient.createPlayer(
                    document.getElementById('player-name').value,
                    parseInt(document.getElementById('player-team').value),
                    document.getElementById('player-position').value,
                    stats
                );
                this.showToast('Player created successfully', 'success');
            }
            document.getElementById('player-modal').classList.remove('show');
            this.loadPlayers();
        } catch (error) {
            this.showToast(error.message, 'error');
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
                select.innerHTML = '';
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
            APIClient.getMatch(matchId).then(match => {
                document.getElementById('match-id').value = match.id;
                document.getElementById('match-home-team').value = match.home_team_id;
                document.getElementById('match-away-team').value = match.away_team_id;
                document.getElementById('match-date').value = match.match_date.slice(0, 16);
            });
        } else {
            title.textContent = 'Schedule Match';
            form.reset();
            document.getElementById('match-id').value = '';
        }

        modal.classList.add('show');
    }

    static async submitMatchForm(e) {
        e.preventDefault();
        const matchId = document.getElementById('match-id').value;
        const homeTeamId = parseInt(document.getElementById('match-home-team').value);
        const awayTeamId = parseInt(document.getElementById('match-away-team').value);
        const matchDate = document.getElementById('match-date').value + ':00';

        if (homeTeamId === awayTeamId) {
            this.showToast('Teams cannot play themselves', 'error');
            return;
        }

        try {
            if (!matchId) {
                await APIClient.createMatch(homeTeamId, awayTeamId, matchDate);
                this.showToast('Match scheduled successfully', 'success');
            }
            document.getElementById('match-modal').classList.remove('show');
            this.loadMatches();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // ========== DATA LOADING ==========

    static async loadData() {
        await this.loadTeams();
        await this.loadPlayers();
        await this.loadMatches();
    }

    static async loadTeams() {
        try {
            const teams = await APIClient.getAllTeams();
            const container = document.getElementById('teams-list');
            container.innerHTML = '';

            teams.forEach(team => {
                const card = this.createTeamCard(team);
                container.appendChild(card);
            });

            if (teams.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No teams yet. Create one to get started!</p>';
            }
        } catch (error) {
            this.showToast('Failed to load teams', 'error');
        }
    }

    static createTeamCard(team) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${team.name}</div>
                    <div class="card-subtitle">${team.city || 'Unknown City'}</div>
                </div>
            </div>
            <div class="team-record">Record: ${team.record}</div>
            <div class="team-record">Coach: ${team.coach || 'N/A'}</div>
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
            const playerList = roster.roster.map(p => `${p.name} (${p.position})`).join('<br>');
            this.showToast(`${roster.team_name} Roster:<br>${playerList || 'No players'}`, 'info');
        } catch (error) {
            this.showToast('Failed to load roster', 'error');
        }
    }

    static async deleteTeam(teamId) {
        if (!confirm('Are you sure you want to delete this team?')) return;

        try {
            await APIClient.deleteTeam(teamId);
            this.showToast('Team deleted successfully', 'success');
            this.loadTeams();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    static async loadPlayers() {
        try {
            const players = await APIClient.getAllPlayers();
            const container = document.getElementById('players-list');
            container.innerHTML = '';

            players.forEach(player => {
                const card = this.createPlayerCard(player);
                container.appendChild(card);
            });

            if (players.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No players yet.</p>';
            }
        } catch (error) {
            this.showToast('Failed to load players', 'error');
        }
    }

    static createPlayerCard(player) {
        const stats = player.stats;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${player.name}</div>
                    <div class="card-subtitle">Level ${player.level} • ${player.position}</div>
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
                <button class="btn btn-secondary btn-small" onclick="UIManager.levelUpPlayer(${player.id})">Level Up</button>
                <button class="btn btn-danger btn-small" onclick="UIManager.deletePlayer(${player.id})">Release</button>
            </div>
        `;
        return card;
    }

    static async levelUpPlayer(playerId) {
        const player = await APIClient.getPlayer(playerId);
        const deltas = {
            'HP': parseInt(prompt(`Increase HP (current: ${player.stats.HP}):`, '10')) || 0,
            'SPD': parseInt(prompt(`Increase SPD (current: ${player.stats.SPD}):`, '2')) || 0,
            'END': parseInt(prompt(`Increase END (current: ${player.stats.END}):`, '2')) || 0,
            'ATK': parseInt(prompt(`Increase ATK (current: ${player.stats.ATK}):`, '2')) || 0,
            'PAS': parseInt(prompt(`Increase PAS (current: ${player.stats.PAS}):`, '2')) || 0,
            'SHT': parseInt(prompt(`Increase SHT (current: ${player.stats.SHT}):`, '2')) || 0,
            'BLI': parseInt(prompt(`Increase BLI (current: ${player.stats.BLI}):`, '1')) || 0,
            'RCH': parseInt(prompt(`Increase RCH (current: ${player.stats.RCH}):`, '1')) || 0
        };

        try {
            await APIClient.levelUpPlayer(playerId, deltas);
            this.showToast(`${player.name} leveled up!`, 'success');
            this.loadPlayers();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    static async deletePlayer(playerId) {
        if (!confirm('Are you sure you want to release this player?')) return;

        try {
            await APIClient.deletePlayer(playerId);
            this.showToast('Player released successfully', 'success');
            this.loadPlayers();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    static async loadMatches() {
        try {
            const matches = await APIClient.getAllMatches();
            const container = document.getElementById('matches-list');
            container.innerHTML = '';

            matches.forEach(match => {
                const card = this.createMatchCard(match);
                container.appendChild(card);
            });

            if (matches.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No matches scheduled.</p>';
            }
        } catch (error) {
            this.showToast('Failed to load matches', 'error');
        }
    }

    static createMatchCard(match) {
        const card = document.createElement('div');
        card.className = 'card';
        const date = new Date(match.match_date).toLocaleString();
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${match.home_team_name} vs ${match.away_team_name}</div>
                    <div class="card-subtitle">${date}</div>
                </div>
                <div class="card-subtitle" style="font-weight: 600; font-size: 16px;">${match.status}</div>
            </div>
            <div style="text-align: center; font-size: 24px; font-weight: 700; margin: 15px 0;">
                ${match.home_score} - ${match.away_score}
            </div>
            <div class="card-actions">
                ${match.status === 'scheduled' ? `<button class="btn btn-primary btn-small" onclick="UIManager.startMatch(${match.id})">Start</button>` : ''}
                ${match.status === 'in_progress' ? `<button class="btn btn-secondary btn-small" onclick="UIManager.finishMatch(${match.id})">Finish</button>` : ''}
                <button class="btn btn-danger btn-small" onclick="UIManager.deleteMatch(${match.id})">Delete</button>
            </div>
        `;
        return card;
    }

    static async startMatch(matchId) {
        try {
            await APIClient.startMatch(matchId);
            this.showToast('Match started', 'success');
            this.loadMatches();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    static async finishMatch(matchId) {
        try {
            const match = await APIClient.getMatch(matchId);
            const homeScore = parseInt(prompt(`Home team final score (current: ${match.home_score}):`, match.home_score));
            const awayScore = parseInt(prompt(`Away team final score (current: ${match.away_score}):`, match.away_score));

            if (homeScore !== null && awayScore !== null) {
                await APIClient.updateScore(matchId, homeScore, awayScore);
                await APIClient.finishMatch(matchId);
                this.showToast('Match finished', 'success');
                this.loadMatches();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    static async deleteMatch(matchId) {
        if (!confirm('Delete this match?')) return;

        try {
            await APIClient.deleteMatch(matchId);
            this.showToast('Match deleted', 'success');
            this.loadMatches();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // ========== UTILITIES ==========

    static setupEventListeners() {
        // Any additional event listeners
    }

    static showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
}

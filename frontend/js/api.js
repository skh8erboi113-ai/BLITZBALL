/**
 * API Client - Handles all backend communication
 * Production-ready with error handling and retries
 */

const API_URL = 'http://localhost:5000/api';

class APIClient {
    /**
     * Core request handler with error handling
     */
    static async request(endpoint, method = 'GET', data = null, retries = 3) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        let lastError;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await fetch(`${API_URL}${endpoint}`, options);
                const json = await response.json();

                if (!response.ok) {
                    throw new Error(json.error || `HTTP ${response.status}: ${response.statusText}`);
                }

                return json;
            } catch (error) {
                lastError = error;
                if (attempt < retries - 1) {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }

        console.error('API Error:', lastError);
        throw lastError;
    }

    // ========== TEAMS ==========

    static async getAllTeams() {
        return this.request('/teams');
    }

    static async getTeam(teamId) {
        return this.request(`/teams/${teamId}`);
    }

    static async createTeam(name, city, coach) {
        return this.request('/teams', 'POST', { name, city, coach });
    }

    static async updateTeam(teamId, data) {
        return this.request(`/teams/${teamId}`, 'PUT', data);
    }

    static async deleteTeam(teamId) {
        return this.request(`/teams/${teamId}`, 'DELETE');
    }

    static async getRoster(teamId) {
        return this.request(`/teams/${teamId}/roster`);
    }

    // ========== PLAYERS ==========

    static async getAllPlayers(filters = {}) {
        const params = new URLSearchParams();
        if (filters.team_id) params.append('team_id', filters.team_id);
        if (filters.position) params.append('position', filters.position);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/players${query}`);
    }

    static async getPlayer(playerId) {
        return this.request(`/players/${playerId}`);
    }

    static async createPlayer(name, teamId, position, stats) {
        const data = {
            name,
            team_id: teamId,
            position,
            hp: stats.HP,
            spd: stats.SPD,
            end: stats.END,
            atk: stats.ATK,
            pas: stats.PAS,
            sht: stats.SHT,
            bli: stats.BLI,
            rch: stats.RCH
        };
        return this.request('/players', 'POST', data);
    }

    static async updatePlayer(playerId, data) {
        return this.request(`/players/${playerId}`, 'PUT', data);
    }

    static async levelUpPlayer(playerId, statDeltas) {
        return this.request(`/players/${playerId}/levelup`, 'POST', { stat_deltas: statDeltas });
    }

    static async transferPlayer(playerId, newTeamId) {
        return this.request(`/players/${playerId}/transfer`, 'POST', { new_team_id: newTeamId });
    }

    static async deletePlayer(playerId) {
        return this.request(`/players/${playerId}`, 'DELETE');
    }

    // ========== MATCHES ==========

    static async getAllMatches(status = null) {
        const query = status ? `?status=${status}` : '';
        return this.request(`/matches${query}`);
    }

    static async getMatch(matchId) {
        return this.request(`/matches/${matchId}`);
    }

    static async createMatch(homeTeamId, awayTeamId, matchDate) {
        return this.request('/matches', 'POST', {
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            match_date: matchDate
        });
    }

    static async startMatch(matchId) {
        return this.request(`/matches/${matchId}/start`, 'POST');
    }

    static async updateScore(matchId, homeScore, awayScore) {
        return this.request(`/matches/${matchId}/score`, 'POST', {
            home_score: homeScore,
            away_score: awayScore
        });
    }

    static async finishMatch(matchId) {
        return this.request(`/matches/${matchId}/finish`, 'POST');
    }

    static async resolveEncounter(matchId, carrierId, defenderIds) {
        return this.request(`/matches/${matchId}/encounter`, 'POST', {
            carrier_id: carrierId,
            defender_ids: defenderIds
        });
    }

    static async deleteMatch(matchId) {
        return this.request(`/matches/${matchId}`, 'DELETE');
    }

    // ========== SIMULATION ==========

    static async simulateMatch(matchId) {
        return this.request(`/simulation/match/${matchId}/simulate`, 'POST');
    }

    // ========== BUILDER ==========

    static async buildTeam(name, city, coach, skillLevel) {
        return this.request('/builder/team', 'POST', {
            name,
            city,
            coach,
            skill_level: skillLevel
        });
    }

    static async seedLeague() {
        return this.request('/builder/seed-league', 'POST');
    }

    // ========== ANALYTICS ==========

    static async getStandings() {
        return this.request('/analytics/standings');
    }

    static async getTopScorers() {
        return this.request('/analytics/top-scorers');
    }

    static async getPlayerStats(playerId) {
        return this.request(`/analytics/player/${playerId}/stats`);
    }

    static async getTeamStats(teamId) {
        return this.request(`/analytics/team/${teamId}/stats`);
    }

    static async getLeagueOverview() {
        return this.request('/analytics/league/overview');
    }
}

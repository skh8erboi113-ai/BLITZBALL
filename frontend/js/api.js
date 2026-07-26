/**
 * API Client - Handles all backend communication
 */

const API_URL = 'http://localhost:5000/api';

class APIClient {
    /**
     * Make API request
     */
    static async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.error || 'API request failed');
            }

            return json;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
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

    static async getAllPlayers() {
        return this.request('/players');
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

    static async getAllMatches() {
        return this.request('/matches');
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
}

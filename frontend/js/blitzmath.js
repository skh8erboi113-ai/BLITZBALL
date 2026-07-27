/**
 * BlitzMath - Client-side Blitzball encounter formula
 * Matches backend logic for consistency
 */

class BlitzMath {
    static TACKLE_MIN_FACTOR = 0.50;
    static TACKLE_MAX_FACTOR = 1.50;

    /**
     * Resolve a tackle encounter
     * @param {number} carrierEnd - Ball carrier's endurance
     * @param {Array} defenders - Array of {id, atk} objects
     * @returns {Object} Encounter result
     */
    static resolveEncounter(carrierEnd, defenders) {
        if (!defenders || defenders.length === 0) {
            return {
                success: true,
                remaining_end: carrierEnd,
                stopper_id: -1,
                tackle_log: []
            };
        }

        let currentEnd = carrierEnd;
        let log = [];
        let stopperId = -1;

        for (let defender of defenders) {
            if (!defender.id || defender.atk === undefined) {
                continue;
            }

            const baseAtk = parseInt(defender.atk);
            if (baseAtk <= 0) {
                continue;
            }

            const factor = Math.random() * (this.TACKLE_MAX_FACTOR - this.TACKLE_MIN_FACTOR) + this.TACKLE_MIN_FACTOR;
            const effectiveAtk = Math.floor(baseAtk * factor);
            currentEnd -= effectiveAtk;

            log.push({
                defender_id: defender.id,
                base_atk: baseAtk,
                effective_atk: effectiveAtk,
                end_after: currentEnd
            });

            if (currentEnd <= 0) {
                stopperId = defender.id;
                break;
            }
        }

        const succeeded = stopperId === -1;
        return {
            success: succeeded,
            remaining_end: currentEnd,
            stopper_id: stopperId,
            tackle_log: log
        };
    }

    /**
     * Format encounter result as human-readable string
     */
    static formatResult(result) {
        if (result.success) {
            return `⚡ BREAKTHROUGH! Remaining END: ${result.remaining_end}`;
        } else {
            return `🛡️ BALL LOST! Defender #${result.stopper_id} stole the ball (END: ${result.remaining_end})`;
        }
    }

    /**
     * Calculate expected outcome percentage
     */
    static calculateSuccessProbability(carrierEnd, defenders) {
        const simulations = 1000;
        let successes = 0;

        for (let i = 0; i < simulations; i++) {
            const result = this.resolveEncounter(carrierEnd, defenders);
            if (result.success) successes++;
        }

        return (successes / simulations * 100).toFixed(1);
    }
}

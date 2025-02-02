/**
 * The profile utility provides methods to assemble creep body arrays.
 * @module
 */

const SIMPLE_WORKER_MAX_TIER = 10;
const HEAVY_WORKER_MAX_TIER = 8;
const HAULER_MAX_TIER = 16;
const CLAIMER_MAX_TIER = 1;
const HARVESTER_MAX_TIER = 3;

/**
 * Assembles a body for a Harvester creep which has 2:1:1 WORK to MOVE to CARRY parts.
 * @param tier The scaling size of the creep body.
 * @returns The creep body array.
 */
export function getHarvesterBody(tier: number) {
  if (tier > HARVESTER_MAX_TIER) {
    tier = HARVESTER_MAX_TIER;
  }
  let body: BodyPartConstant[] = [];
  body = addToBody(body, tier, [WORK, WORK, MOVE]);
  return body;
}

export function getRCL2HarvesterBody() {
  return [WORK, WORK, WORK, WORK, WORK, MOVE];
}

/**
 * Determines the maximum size for a Harvester creep based on energy.
 * @param energy The maximum amount of energy to use for spawning the creep body.
 * @returns The maximum tier for the amount of energy.
 */
export function getMaxTierHarvester(energy: number) {
  return getMaxTier(energy, getHarvesterBody, HARVESTER_MAX_TIER);
}

/**
 * Assembles a body for a Claimer creep which has 1:6 CLAIM to MOVE parts.
 * @param tier The scaling size of the creep body.
 * @returns The creep body array.
 */
export function getClaimerBody(tier: number) {
  if (tier > CLAIMER_MAX_TIER) {
    tier = CLAIMER_MAX_TIER;
  }
  return addToBody([], tier, [CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]);
}

/**
 * Determines the maximum size for a Claimer creep based on energy.
 * @param energy The maximum amount of energy to use for spawning the creep body.
 * @returns The maximum tier for the amount of energy.
 */
export function getMaxTierClaimer(energy: number) {
  return getMaxTier(energy, getClaimerBody, CLAIMER_MAX_TIER);
}

/**
 * Assembles a body for a Hauler creep which has 1:1 CARRY to MOVE parts.
 * @param tier The scaling size of the creep body.
 * @returns The creep body array.
 */
export function getHaulerBody(tier: number) {
  if (tier > HAULER_MAX_TIER) {
    tier = HAULER_MAX_TIER;
  }
  return addToBody([], tier, [CARRY, MOVE]);
}

/**
 * Determines the maximum size for a Hauler creep based on energy.
 * @param energy The maximum amount of energy to use for spawning the creep body.
 * @returns The maximum tier for the amount of energy.
 */
export function getMaxTierHauler(energy: number) {
  return getMaxTier(energy, getHaulerBody, HAULER_MAX_TIER);
}

/**
 * Assembles a body for a Simple Worker creep which has 1:1 WORK to CARRY parts.
 * @param tier The scaling size of the creep body.
 * @returns The creep body array.
 */
export function getSimpleWorkerBody(tier: number) {
  if (tier > SIMPLE_WORKER_MAX_TIER) {
    tier = SIMPLE_WORKER_MAX_TIER;
  }
  return addToBody([], tier, [WORK, MOVE, CARRY, MOVE]);
}

/**
 * Determines the maximum size for a Simple Worker creep based on energy.
 * @param energy The maximum amount of energy to use for spawning the creep body.
 * @returns The maximum tier for the amount of energy.
 */
export function getMaxTierSimpleWorker(energy: number) {
  return getMaxTier(energy, getSimpleWorkerBody, SIMPLE_WORKER_MAX_TIER);
}

/**
 * Assembles a body for a Heavy Worker creep which has 3:1 WORK to CARRY parts.
 * @param tier The scaling size of the creep body.
 * @returns The creep body array.
 */
export function getHeavyWorkerBody(tier: number) {
  if (tier > HEAVY_WORKER_MAX_TIER) {
    tier = HEAVY_WORKER_MAX_TIER;
  }
  let body: BodyPartConstant[] = [];
  body = addToBody(body, Math.floor(tier / 2), [WORK, WORK, MOVE, MOVE]);
  body = addToBody(body, Math.ceil(tier / 2), [WORK, CARRY, MOVE, MOVE]);
  return body;
}

/**
 * Determines the maximum size for a Heavy Worker creep based on energy.
 * @param energy The maximum amount of energy to use for spawning the creep body.
 * @returns The maximum tier for the amount of energy.
 */
export function getMaxTierHeavyWorker(energy: number) {
  return getMaxTier(energy, getHeavyWorkerBody, HEAVY_WORKER_MAX_TIER);
}

/**
 * Calculate the total energy cost to spawn a creep based on a body array.
 * @param body The creep body array to evaluate.
 */
export function getCostForBody(body: BodyPartConstant[]) {
  let cost = 0;
  for (const bodypart of body) {
    cost += BODYPART_COST[bodypart];
  }
  return cost;
}

/**
 * Determines the maximum size based on energy for a creep body method.
 *
 */
function getMaxTier(energy: number, bodyFunction: Function, maxTier: number) {
  let tier = 0;
  let maxReached = false;
  for (let i = 1; !maxReached; i++) {
    const cost = getCostForBody(bodyFunction(i));
    if (cost > energy || i > maxTier) {
      maxReached = true;
    } else {
      tier = i;
    }
  }
  return tier;
}

/**
 * Add parts to a creep body array.
 */
function addToBody(body: BodyPartConstant[], count: number, parts: BodyPartConstant[]) {
  for (let i = 0; i < count; i++) {
    body.push(...parts);
  }
  return body;
}

/**
 * A creep role responsible for developing a new room.
 * @module
 */

import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';

enum State {
  HarvestEnergy = 1,
  Build = 2,
  Charge = 3,
  Upgrade = 4
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.HarvestEnergy);
  }

  switch (creep.memory.state) {
    case State.HarvestEnergy:
      runHarvestEnergy(creep);
      break;
    case State.Build:
      runBuild(creep);
      break;
    case State.Upgrade:
      runUpgrade(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.HarvestEnergy);
      break;
  }
}

function runHarvestEnergy(creep: Creep) {
  if (!creep.memory.target) {
    creep.say('🚩No target');
    return;
  }
  const targetRoom = Game.rooms[creep.memory.target];
  if (!targetRoom) {
    creep.say('🚩No room');
    return;
  }
  if (creep.room !== targetRoom) {
    const goal = new RoomPosition(25, 25, creep.memory.target);
    const ret = PathFinder.search(
      creep.pos,
      { pos: goal, range: 25 },
      {
        plainCost: 2,
        swampCost: 10,

        roomCallback: roomName => {
          const room = Game.rooms[roomName];
          if (!room) {
            return false;
          }
          const costs = new PathFinder.CostMatrix();

          room.find(FIND_STRUCTURES).forEach(function (struct) {
            if (struct.structureType === STRUCTURE_ROAD) {
              // Favor roads over plain tiles
              costs.set(struct.pos.x, struct.pos.y, 1);
            } else if (
              struct.structureType !== STRUCTURE_CONTAINER &&
              (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
            ) {
              // Can't walk through non-walkable buildings
              costs.set(struct.pos.x, struct.pos.y, 0xff);
            }
          });

          // Avoid creeps and wall in the room
          room.find(FIND_CREEPS).forEach(function (c) {
            costs.set(c.pos.x, c.pos.y, 0xff);
          });
          // Avoid constructed walls
          // Avoid 10 range from hostile creeps
          room.find(FIND_HOSTILE_CREEPS).forEach(c => {
            for (let i = -5; i <= 5; i++) {
              for (let j = -5; j <= 5; j++) {
                costs.set(c.pos.x + i, c.pos.y + j, 0xff);
              }
            }
          });
          return costs;
        }
      }
    );
    const pos = ret.path[0];
    creep.move(creep.pos.getDirectionTo(pos));
    return;
  }
  if (creep.store.getFreeCapacity() === 0) {
    creep.setState(State.Build);
    creep.say('🚧Build');
    runBuild(creep);
    return;
  }
  const sources = creep.room.find(FIND_SOURCES);
  if (sources.length === 0) {
    creep.say('🚩No sources');
    return;
  }
  const source = sources[0];
  if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
    moveTo(creep, source, { visualizePathStyle: { stroke: '#ffaa00' } });
  }
}

function runBuild(creep: Creep) {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.setState(State.HarvestEnergy);
    creep.say('🔄Harvest');
    runHarvestEnergy(creep);
    return;
  }
  const constructionSite = creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];
  if (!constructionSite) {
    creep.setState(State.Charge);
    creep.say('⚡Charge');
    runCharge(creep);
    return;
  }
  if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
    moveTo(creep, constructionSite, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

function runCharge(creep: Creep) {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.setState(State.HarvestEnergy);
    creep.say('🔄Harvest');
    runHarvestEnergy(creep);
    return;
  }
  const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
  if (!spawn) {
    creep.say('🚩No spawn');
    return;
  }
  if (creep.room.energyAvailable === creep.room.energyCapacityAvailable) {
    creep.setState(State.Upgrade);
    creep.say('⚡Upgrade');
    runUpgrade(creep);
    return;
  }
  if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    moveTo(creep, spawn, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

function runUpgrade(creep: Creep) {
  const controller = creep.room.controller;
  if (!controller) {
    creep.say('🚩No controller');
    return;
  }
  if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.setState(State.HarvestEnergy);
    creep.say('🔄Harvest');
    runHarvestEnergy(creep);
    return;
  }
  if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    moveTo(creep, controller, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

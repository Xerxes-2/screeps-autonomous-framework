/**
 * The commands utility provides global commands for the Screeps game console.
 * @module
 */

import { error } from 'utils/log';
import { createTestOperation, isTestOperationActive } from 'utils/operation';

declare global {
  /* eslint-disable no-var */

  /**
   * A global command to create a Test operation from the Screeps game console.
   * @param duration (optional) The amount of time the operation will be active.
   */
  var addTestOperation: (duration?: number) => string | void;
  var getTravelCost: (originRoom: string, destinationRoom: string) => number;

  /* eslint-enable no-var */
}

/**
 * Return log messages to the console instead of calling `console.log()`.
 */
const print = false;

global.addTestOperation = (duration = 50) => {
  if (duration < 10) {
    return error('Test operation duration must be at least 10 ticks.', null, print);
  }
  if (isTestOperationActive()) {
    return error('Test operation is already active.', null, print);
  }
  return createTestOperation(duration, print);
};

global.getTravelCost = (originRoom: string, destinationRoom: string) => {
  const pfResult = PathFinder.search(
    new RoomPosition(25, 25, originRoom),
    { pos: new RoomPosition(25, 25, destinationRoom), range: 25 },
    {
      plainCost: 2,
      swampCost: 10,
      maxRooms: 64,

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
        // Avoid 3 range from hostile creeps
        room.find(FIND_HOSTILE_CREEPS).forEach(c => {
          if (c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK)) {
            for (let x = c.pos.x - 3; x <= c.pos.x + 3; x++) {
              for (let y = c.pos.y - 3; y <= c.pos.y + 3; y++) {
                costs.set(x, y, 0xff);
              }
            }
          }
        });
        return costs;
      }
    }
  );
  if (pfResult.incomplete) {
    error(`Pathfinding incomplete for ${originRoom} to ${destinationRoom}.`, null, true);
  }
  return pfResult.cost;
};

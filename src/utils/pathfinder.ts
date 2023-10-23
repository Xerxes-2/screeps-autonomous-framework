/**
 * The pathfinder module provides a set of functions for pathfinding and navigation.
 * @module
 */

export function travelTo(creep: Creep, goalRoom: string, ops = 4000) {
  // if with in 23 range of goal room, return false
  const creepPos = creep.pos;
  if (creepPos.roomName === goalRoom) {
    if (creepPos.inRangeTo(25, 25, 24)) {
      return false;
    }
  }

  // const route = Game.map.findRoute(creep.room.name, goalRoom, {
  //   routeCallback(roomName, fromRoomName) {
  //     if (Game.map.getRoomStatus(roomName).status === 'closed') {
  //       return Infinity;
  //     }
  //     if (
  //       (Game.map.getRoomStatus(roomName).status === 'novice') !==
  //       (Game.map.getRoomStatus(fromRoomName).status === 'novice')
  //     ) {
  //       return Infinity;
  //     }
  //   }
  // });
  // if (route === ERR_NO_PATH) {
  //   return false;
  // }
  const pfResult = PathFinder.search(
    creep.pos,
    { pos: new RoomPosition(25, 25, goalRoom), range: 23 },
    {
      plainCost: 2,
      swampCost: 10,
      maxOps: ops,

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
          if (c.owner.username === 'Source Keeper') {
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

  const path = pfResult.path;
  if (path.length === 0) {
    return false;
  }
  const pos = path[0];
  creep.move(creep.pos.getDirectionTo(pos));
  return true;
}

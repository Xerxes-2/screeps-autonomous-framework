/**
 * The pathfinder module provides a set of functions for pathfinding and navigation.
 * @module
 */

export function travelTo(creep: Creep, goalRoom: string) {
  const pfResult = PathFinder.search(
    creep.pos,
    { pos: new RoomPosition(25, 25, goalRoom), range: 23 },
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

  const path = pfResult.path;
  const pos = path[0];
  creep.move(creep.pos.getDirectionTo(pos));
}

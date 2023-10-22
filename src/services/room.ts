import { RoomType } from 'enums/roomType';

/**
 * An object to manage rooms in the colony by type.
 */
type RoomDictionary = Record<RoomType, Room[]>;

/**
 * A class to facilitate accessing rooms in the colony.
 */
export class RoomService {
  /**
   * An object containing all rooms in the colony.
   */
  private roomDictionary: RoomDictionary;

  constructor() {
    this.roomDictionary = this.makeDictionary();
  }

  /**
   * Fetches all rooms in the colony with the Normal room type.
   */
  public getNormalRooms() {
    const rooms: Room[] = [];
    if (this.roomDictionary[RoomType.Normal]) {
      rooms.push(...this.roomDictionary[RoomType.Normal]);
    }
    return rooms;
  }

  public getInDevRooms() {
    const rooms: Room[] = [];
    if (this.roomDictionary[RoomType.InDev]) {
      rooms.push(...this.roomDictionary[RoomType.InDev]);
    }
    return rooms;
  }

  public getAllRooms() {
    return Object.values(this.roomDictionary).flat();
  }

  /**
   * Creates an object of all rooms in the colony indexed by type using `Game.rooms`.
   */
  protected makeDictionary() {
    const rooms: RoomDictionary = {
      [RoomType.Normal]: [],
      [RoomType.InDev]: []
    };

    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];

      if (!room.controller || !room.controller.my || room.controller.level < 1) {
        continue;
      }
      if (room.controller.level < 3) {
        room.memory.t = RoomType.InDev;
      } else {
        room.memory.t = RoomType.Normal;
      }

      if (!rooms[room.memory.t]) {
        rooms[room.memory.t] = [];
      }
      rooms[room.memory.t].push(room);
    }
    return rooms;
  }
}

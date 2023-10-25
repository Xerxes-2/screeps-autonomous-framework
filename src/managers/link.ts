import { Priority } from 'enums/priority';
import { Manager } from 'managers/manager';
import { RoomService } from 'services/room';

/**
 * The `LinkManager` class orchestrates the link structure behaviors of the bot.
 *
 * This class should be utilized whenever you need to control links and their associated logic
 * for transferring energy between links.
 */

export class LinkManager extends Manager {
  private roomService: RoomService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(roomService: RoomService) {
    super('LinkManager');
    this.roomService = roomService;
  }

  public run(pri: Priority) {
    if (pri === Priority.Standard) {
      const normalRooms = this.roomService.getNormalRooms();
      for (const room of normalRooms) {
        this.controlLinks(room);
      }
    }
  }

  private controlLinks(room: Room) {
    const sourceLinks = room.getAllTanks().filter(s => s.structureType === STRUCTURE_LINK) as StructureLink[];
    const storageLink = room.getStorageLink();
    if (!storageLink || !sourceLinks.length) {
      return;
    }
    for (const sourceLink of sourceLinks) {
      if (!sourceLink.store.getFreeCapacity(RESOURCE_ENERGY) && !storageLink.store.getUsedCapacity(RESOURCE_ENERGY)) {
        sourceLink.transferEnergy(storageLink);
      }
    }
  }
}

import { Order } from 'classes/order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as Harvester from 'roles/harvester';
import * as RemoteHauler from 'roles/remoteHauler';
import { CreepService } from 'services/creep';
import { RoomService } from 'services/room';
import { getCreepsInQueue, orderCreep } from 'utils/order';
import {
  getHarvesterBody,
  getHaulerBody,
  getMaxTierHarvester,
  getMaxTierHauler,
  getRCL2HarvesterBody
} from 'utils/profile';

/**
 * The `HarvestManager` class orchestrates the energy gathering activities and behaviors of the bot.
 *
 * This class should be utilized whenever you need to control and manage Harvester creeps and their
 * associated tasks within the framework.
 */

export class HarvestManager extends Manager {
  private roomService: RoomService;
  private creepService: CreepService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(roomService: RoomService, creepService: CreepService) {
    super('HarvestManager');
    this.roomService = roomService;
    this.creepService = creepService;
  }

  public run(pri: Priority) {
    if (pri === Priority.Low) {
      this.creepService.runCreepRoles(Role.Harvester, Harvester.run);
      this.creepService.runCreepRoles(Role.RemoteHauler, RemoteHauler.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        const normalRooms = this.roomService.getNormalRooms();
        const inDevRooms = this.roomService.getInDevRooms();
        const rooms = normalRooms.concat(inDevRooms);
        for (const room of rooms) {
          this.organizeEnergyHarvesting(room);
        }
        for (const room of normalRooms) {
          this.organizeRemoteEnergyHarvesting(room);
        }
        this.setValue(this.MEMORY_LASTRUN, Game.time);
      }
    }
  }

  private organizeEnergyHarvesting(room: Room) {
    const sources = room.find(FIND_SOURCES);
    for (const source of sources) {
      this.orderHarvesters(room, source.id, room.name);
    }
  }
  private organizeRemoteEnergyHarvesting(room: Room) {
    const remoteSinks = room.getRemoteTanks();
    for (const sink of remoteSinks) {
      const sourceRoom = sink.room;
      const sourceId = sink.pos.findInRange(FIND_SOURCES, 1)[0].id;
      if (!sourceId) {
        continue;
      }
      this.orderHarvesters(room, sourceId, sourceRoom.name);
    }
    if (remoteSinks.length > 0) {
      this.orderRemoteHauler(room);
    }
  }

  private orderHarvesters(room: Room, sourceId: string, sourceRoom: string) {
    const spawn = room.getMySpawn();
    if (!spawn) {
      return;
    }

    const sourceTarget = sourceRoom + '-' + sourceId;
    const active = this.creepService.getCreeps(Role.Harvester, sourceTarget, room.name).length;
    const ordered = getCreepsInQueue(room, Role.Harvester, sourceTarget);

    if (active + ordered === 0) {
      const order = new Order();
      let maxTier = getMaxTierHarvester(room.energyAvailable);
      if (room.energyCapacityAvailable < 750 && room.energyCapacityAvailable >= 550) {
        order.body = getRCL2HarvesterBody();
        maxTier = 1;
      } else {
        order.body = getHarvesterBody(maxTier);
      }
      const sourceRoomObj = Game.rooms[sourceRoom];
      if (
        sourceRoomObj &&
        sourceRoomObj.getSourceTanks(sourceId as Id<Source>).some(t => t.structureType === STRUCTURE_LINK) &&
        room.energyAvailable >= 850
      ) {
        order.body.push(CARRY, CARRY);
      }
      if (room.name === sourceRoom) {
        order.priority = Priority.Critical;
      } else {
        order.priority = Priority.Standard;
      }
      order.memory = {
        role: Role.Harvester,
        tier: maxTier,
        target: sourceTarget
      };
      orderCreep(room, order);
    }
  }

  private orderRemoteHauler(homeroom: Room): void {
    if (homeroom.getRemoteTanks().length === 0) {
      return;
    }
    const activeCreeps = this.creepService.getCreeps(Role.RemoteHauler, null, homeroom.name);
    const creepsInQueue = getCreepsInQueue(homeroom, Role.RemoteHauler);

    if (activeCreeps.length + creepsInQueue < 2) {
      const order = new Order();
      const maxTier = getMaxTierHauler(homeroom.energyCapacityAvailable);
      order.body = getHaulerBody(maxTier);
      order.priority = Priority.Low;
      order.memory = {
        tier: maxTier,
        role: Role.RemoteHauler
      };
      orderCreep(homeroom, order);
    }
  }
}

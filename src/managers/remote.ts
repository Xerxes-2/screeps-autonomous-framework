import { Order } from 'classes/order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as RemoteBuilder from 'roles/remoteBuilder';
import * as Scouter from 'roles/scouter';
import { CreepService } from 'services/creep';
import { RoomService } from 'services/room';
import { getCreepsInQueue, orderCreep } from 'utils/order';
import { getMaxTierSimpleWorker, getSimpleWorkerBody } from 'utils/profile';

/**
 * The `RemoteManager` class orchestrates the remote building activities and behaviors of the bot.
 *
 * This class should be utilized whenever you need to control and manage remote mining creeps and their
 */

export class RemoteManager extends Manager {
  private roomService: RoomService;
  private creepService: CreepService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(roomService: RoomService, creepService: CreepService) {
    super('RemoteManager');
    this.roomService = roomService;
    this.creepService = creepService;
  }

  public run(pri: Priority): void {
    if (pri === Priority.Low) {
      this.creepService.runCreepRoles(Role.RemoteBuilder, RemoteBuilder.run);
      this.creepService.runCreepRoles(Role.Scout, Scouter.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        const normalRooms = this.roomService.getNormalRooms();
        this.organizeRemoteBuilding(normalRooms);
        this.setValue(this.MEMORY_LASTRUN, Game.time);
      }
    }
  }

  private organizeRemoteBuilding(rooms: Room[]): void {
    for (const room of rooms) {
      // find neighboring rooms with construction sites or containers
      for (const remoteRoomName of room.getRemoteRooms()) {
        const remoteRoom = Game.rooms[remoteRoomName];
        if (!remoteRoom) {
          this.orderScouter(room, remoteRoomName);
        } else {
          this.orderRemoteBuilder(room, remoteRoom);
        }
      }
    }
  }
  private orderScouter(homeroom: Room, remoteRoom: string): void {
    const activeCreeps = this.creepService.getCreeps(Role.Scout, remoteRoom);
    const creepsInQueue = getCreepsInQueue(homeroom, Role.Scout, remoteRoom);

    if (activeCreeps.length + creepsInQueue === 0) {
      const order = new Order();
      order.body = [MOVE];
      order.priority = Priority.Low;
      order.memory = {
        tier: 1,
        role: Role.Scout,
        target: remoteRoom
      };
      orderCreep(homeroom, order);
    }
  }

  private orderRemoteBuilder(homeroom: Room, remoteRoom: Room): void {
    const constructionSites = remoteRoom.find(FIND_MY_CONSTRUCTION_SITES);
    const containers = remoteRoom.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    // if no construction sites or containers hp > 80%, return
    if (constructionSites.length === 0 && containers.every(c => c.hits < 100_000)) {
      return;
    }

    const activeCreeps = this.creepService.getCreeps(Role.RemoteBuilder, remoteRoom.name);
    const creepsInQueue = getCreepsInQueue(homeroom, Role.RemoteBuilder, remoteRoom.name);

    if (activeCreeps.length + creepsInQueue === 0) {
      const maxTier = getMaxTierSimpleWorker(homeroom.energyCapacityAvailable);
      const body = getSimpleWorkerBody(maxTier);
      const order = new Order();
      order.body = body;
      order.priority = Priority.Low;
      order.memory = {
        tier: maxTier,
        role: Role.RemoteBuilder,
        target: remoteRoom.name
      };
      orderCreep(homeroom, order);
    }
  }
}

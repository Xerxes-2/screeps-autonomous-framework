import { Order } from 'classes/order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as RemoteBuilder from 'roles/remoteBuilder';
import * as RemoteDefender from 'roles/remoteDefender';
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
      this.creepService.runCreepRoles(Role.RemoteDefender, RemoteDefender.run);
      this.creepService.runCreepRoles(Role.RemoteBuilder, RemoteBuilder.run);
      this.creepService.runCreepRoles(Role.Scout, Scouter.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        const normalRooms = this.roomService.getNormalRooms();
        this.organizeRemote(normalRooms);
        this.setValue(this.MEMORY_LASTRUN, Game.time);
      }
    }
  }

  private organizeRemote(rooms: Room[]): void {
    for (const room of rooms) {
      // find neighboring rooms with construction sites or containers
      for (const remoteRoomName of room.getRemoteRooms()) {
        this.orderScouter(room, remoteRoomName);
        const remoteRoom = Game.rooms[remoteRoomName];
        if (remoteRoom) {
          this.orderRemoteBuilder(room, remoteRoom);
          this.orderRemoteDefender(room, remoteRoom);
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
      order.priority = Priority.Critical;
      order.memory = {
        tier: 1,
        role: Role.Scout,
        target: remoteRoom
      };
      orderCreep(homeroom, order);
    }
  }

  private orderRemoteBuilder(homeroom: Room, remoteRoom: Room): void {
    const constructionSites = remoteRoom.getConstructionSites();
    const containers = remoteRoom.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    if (constructionSites.length === 0 && containers.every(c => c.hits >= 100_000)) {
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

  private orderRemoteDefender(homeroom: Room, remoteRoom: Room): void {
    // if dont have container, return
    const containers = remoteRoom.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    if (containers.length === 0) {
      return;
    }
    const activeCreeps = this.creepService.getCreeps(Role.RemoteDefender, remoteRoom.name, homeroom.name);
    const creepsInQueue = getCreepsInQueue(homeroom, Role.RemoteDefender, remoteRoom.name);

    let max = 0;
    // if invaders are present, spawn defenders
    const invaders = remoteRoom.find(FIND_HOSTILE_CREEPS, {
      filter: c => c.owner.username === 'Invader'
    });
    if (invaders.length === 1) {
      max = 1;
    }
    if (activeCreeps.length + creepsInQueue < max) {
      const order = new Order();
      // 10 * [ATTACK, MOVE]
      order.body = [
        ATTACK,
        MOVE,
        ATTACK,
        MOVE,
        ATTACK,
        MOVE,
        ATTACK,
        MOVE,
        ATTACK,
        MOVE,
        ATTACK,
        MOVE,
        ATTACK,
        MOVE,
        ATTACK,
        MOVE,
        ATTACK,
        MOVE,
        ATTACK,
        MOVE
      ];
      order.priority = Priority.Low;
      order.memory = {
        tier: 1,
        role: Role.RemoteDefender,
        target: remoteRoom.name
      };
      orderCreep(homeroom, order);
    }
  }
}

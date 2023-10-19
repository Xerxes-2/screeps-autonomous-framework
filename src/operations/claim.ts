// /**
//  * Claim a room.
//  * @module
//  */

// import { Order } from 'classes/order';
// import { OperationType } from 'enums/operationType';
// import { Priority } from 'enums/priority';
// import { Role } from 'enums/role';
// import { CreepService } from 'services/creep';
// import { RoomService } from 'services/room';
// import { info, success } from 'utils/log';

// /**
//  * Conditions to indicate the operation is complete.
//  */
// export enum VictoryCondition {
//   RoomControlled = 2
// }

// /**
//  * Memory data used for the operation.
//  */
// export class Data implements OperationData {
//   type: OperationType = OperationType.Claim;
//   active = true;
//   victoryCondition: VictoryCondition;
//   victoryValue: number;
//   stage = 0;
// }

// /**
//  * Perform tasks while the operation is active.
//  */
// export function run(
//   operation: Data,
//   pri: Priority,
//   roomService: RoomService,
//   creepService: CreepService,
//   roomName: string
// ) {
//   if (pri === Priority.Low) {
//     if (Game.time % 10 === 0) {
//       claim(operation);
//     }
//   }
// }

// /**
//  * Check if the operation has been completed.
//  */
// export function victoryConditionReached(operation: Data, roomService: RoomService, roomName: string) {
//   const rooms = roomService.getNormalRooms();
//   operation.victoryValue = rooms.length;
//   if (operation.victoryCondition === VictoryCondition.RoomControlled) {
//     if (roomName in rooms.map(r => r.name)) {
//       success(`Claim operation finished at ${Game.time}.`);
//       operation.active = false;
//       return true;
//     }
//   }
//   return false;
// }

// function spawnClaimer(operation: Data, creepService: CreepService, roomService: RoomService) {
//   const room = roomService.getNormalRooms()[0];
//   const spawn = room.getMySpawn();
//   const claimers = creepService.getCreeps(Role.Claimer);
//   if (claimers.length < 1) {
//     const order = new Order();
//   }
// }

// function claim(operation: Data) {
//   if (Game.rooms[operation.victoryValue]) {
//     return;
//   }
//   info(`Claim operation is active for ${operation.victoryValue - Game.time} more ticks.`);
// }

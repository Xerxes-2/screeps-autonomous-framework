export {};

declare global {
  interface Room {
    /** Finds the first owned spawn in a room if available. */
    getMySpawn(): StructureSpawn | undefined;

    /** @private */
    _mySpawn?: StructureSpawn;

    /** Find the sinks for the source */
    getSourceSinks(source: Id<Source>): StructureContainer[];

    /** Find all sinks in room */
    getAllSinks(): StructureContainer[];

    /** @private */
    _sourceSinksMap?: { [source: Id<Source>]: StructureContainer[] };

    /** @private */
    _allSinks?: StructureContainer[];

    /** @private */
    _remoteRooms?: string[];

    /** Find all remote rooms */
    getRemoteRooms(): string[];
  }
}

Room.prototype.getMySpawn = function () {
  if (!this._mySpawn) {
    this._mySpawn = this.find(FIND_MY_SPAWNS)?.[0];
  }
  return this._mySpawn;
};

Room.prototype.getSourceSinks = function (sourceId: Id<Source>) {
  if (!this._sourceSinksMap) {
    this._sourceSinksMap = {};
  }
  if (!this._sourceSinksMap[sourceId]) {
    const source = Game.getObjectById(sourceId);
    if (!source) {
      return [];
    }
    this._sourceSinksMap[sourceId] = source.pos.findInRange(FIND_STRUCTURES, 2, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
  }
  return this._sourceSinksMap[sourceId];
};

Room.prototype.getAllSinks = function () {
  if (!this._allSinks) {
    this._sourceSinksMap = {};
    for (const source of this.find(FIND_SOURCES)) {
      this.getSourceSinks(source.id);
    }
    this._allSinks = _.flatten(Object.values(this._sourceSinksMap));
  }
  return this._allSinks;
};

Room.prototype.getRemoteRooms = function () {
  if (!this._remoteRooms) {
    this._remoteRooms = [];
    for (const roomName of Object.values(Game.map.describeExits(this.name))) {
      this._remoteRooms.push(roomName);
    }
  }
  return this._remoteRooms;
};

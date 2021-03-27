const textStart = 1068;
const textEnd = 1446;
const addrOffset = 0xB9E8B;

const bosses = ["Chestbeater", "King Scorpion", "Sea Fighter", "Briggs", "Aqua Hydra",
    "Serpent", "Avimander", "Poseidon", "Moapa", "Knight", "Agatio", "Karst", "Flame Dragon",
    "Doom Dragon", "Star Magician", "Refresh Ball", "Thunder Ball", "Anger Ball", "Guardian Ball",
    "Valukar", "Sentinel", "Dullahan"];

const djinnIds = [
    [2, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14], [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    [32, 33, 35, 38, 39, 42, 43], [48, 49, 51, 52, 53, 54, 55, 56, 57, 58]
];

var enemyData = {};

function loadFullEnemyData(rom, enemy) {
    var addr = enemy.addr;
    enemy.full = true;

    enemy.level = rom[addr];
    enemy.hp = rom[addr + 1] + (rom[addr + 2] << 8);
    enemy.pp = rom[addr + 3] + (rom[addr + 4] << 8);
    enemy.attack = rom[addr + 5] + (rom[addr + 6] << 8);
    enemy.defense = rom[addr + 7] + (rom[addr + 8] << 8);
    enemy.agility = rom[addr + 9] + (rom[addr + 10] << 8);
    enemy.luck = rom[addr + 11];
    enemy.turnCount = rom[addr + 12];
    enemy.hpRegen = rom[addr + 13];
    enemy.ppRegen = rom[addr + 14];

    enemy.items = [], enemy.attacks = [], enemy.unknowns = [];
    for (var i = 0; i < 4; ++i) {
        enemy.items.push([
            rom[addr + 15 + 2 * i] + (rom[addr + 16 + 2 * i] << 8), 
            rom[addr + 23 + i]
        ]);
        enemy.attacks.push(rom[addr + 31 + 4 * i] + (rom[addr + 32 + 4 * i] << 8));
        enemy.attacks.push(rom[addr + 33 + 4 * i] + (rom[addr + 34 + 4 * i] << 8));
        enemy.unknowns.push(rom[addr + 47 + i]);
    }

    enemy.attackEffect = rom[addr + 28];
    enemy.attackPattern = rom[addr + 29];
    enemy.attackFlags = rom[addr + 30];
    enemy.drop = rom[addr + 53] + (rom[addr + 54] << 8);
    enemy.dropRate = rom[addr + 55];
}

function initialise(rom, textutil) {
    var line = textStart;
    while (line <= textEnd) {
        var name = textutil.readLinePretty(undefined, line++);
        if (name == '?') continue;

        var addr = addrOffset + 76 * (line - textStart - 1);
        var coins = rom[addr + 51] + (rom[addr + 52] << 8);
        var exp = rom[addr + 57] + (rom[addr + 58] << 8);

        if (!enemyData.hasOwnProperty(name))
            enemyData[name] = [];
        enemyData[name].push({full: false, id: (line - textStart), addr: addr, coins: coins, exp: exp});
    }

    enemyData["Venus Djinni"].forEach((djinni) => loadFullEnemyData(rom, djinni));
    enemyData["Mercury Djinni"].forEach((djinni) => loadFullEnemyData(rom, djinni));
    enemyData["Mars Djinni"].forEach((djinni) => loadFullEnemyData(rom, djinni));
    enemyData["Jupiter Djinni"].forEach((djinni) => loadFullEnemyData(rom, djinni));
}

function clone() {
    return JSON.parse(JSON.stringify(enemyData));
}

function writeUint16(rom, addr, value) {
    rom[addr] = (value & 0xFF);
    rom[addr + 1] = (value >> 8);
}

function writeFullEnemyData(rom, enemy) {
    var addr = enemy.addr;
    rom[addr] = enemy.level;
    rom[addr + 11] = enemy.luck;
    rom[addr + 12] = enemy.turnCount;
    rom[addr + 13] = enemy.hpRegen;
    rom[addr + 14] = enemy.ppRegen;
    rom[addr + 28] = enemy.attackEffect;
    rom[addr + 29] = enemy.attackPattern;
    rom[addr + 30] = enemy.attackFlags;
    rom[addr + 55] = enemy.dropRate;

    writeUint16(rom, addr + 1, enemy.hp);
    writeUint16(rom, addr + 3, enemy.pp);
    writeUint16(rom, addr + 5, enemy.attack);
    writeUint16(rom, addr + 7, enemy.defense);
    writeUint16(rom, addr + 9, enemy.agility);
    writeUint16(rom, addr + 53, enemy.drop);

    for (var i = 0; i < 4; ++i) {
        writeUint16(rom, addr + 15 + 2 * i, enemy.items[i][0]);
        writeUint16(rom, addr + 31 + 4 * i, enemy.attacks[2 * i]);
        writeUint16(rom, addr + 33 + 4 * i, enemy.attacks[2 * i + 1]);
        rom[addr + 23 + i] = enemy.items[i][1];
        rom[addr + 47 + i] = enemy.unknowns[i];
    }
}

function writeToRom(instance, rom) {
    for (var enemyName in instance) {
        if (!instance.hasOwnProperty(enemyName)) continue;
        instance[enemyName].forEach((enemy) => {
            var addr = enemy.addr;
            writeUint16(rom, addr + 51, enemy.coins);
            writeUint16(rom, addr + 57, enemy.exp);
            if (enemy.full) writeFullEnemyData(rom, enemy);
        });
    }
}

function insertIntoSortedArray(arr, n) {
    for (var i = 0; i < arr.length; ++i) {
        if (n.hp < arr[i].hp) {
            arr.splice(i, 0, n);
            return;
        }
    }
    arr.push(n);
}

function _sortDjinn(instance, name, setId, idOffset, spliceInfo) {
    var enemySet = instance[name];
    var addrList = [], sorted = [];
    djinnIds[setId].forEach((id) => {
        addrList.push(enemySet[id - idOffset].addr);
        insertIntoSortedArray(sorted, enemySet[id - idOffset]);
    });
    spliceInfo.forEach((splice) => sorted.splice(splice[0], splice[1]));

    instance[name] = [];
    sorted.forEach((djinni, i) => {
        djinni.addr = addrList[i];
        instance[name].push(djinni);
    });
}

function sortDjinn(instance) {
    _sortDjinn(instance, "Venus Djinni", 0, 1, [[1, 3]]);
    _sortDjinn(instance, "Mercury Djinni", 1, 15, [[0, 4]]);
    _sortDjinn(instance, "Mars Djinni", 2, 30, [[12, 1], [0, 6]]);
    _sortDjinn(instance, "Jupiter Djinni", 3, 44, [[0, 5]]);
}

function scaleBattleRewards(instance, coinScale, expScale) {
    var bossExpScale = 1 + (expScale - 1) / 2;
    for (var name in instance) {
        if (!instance.hasOwnProperty(name)) continue;
        instance[name].forEach((enemy) => {
            enemy.coins = Math.min(0xFFFF, enemy.coins * coinScale);
            enemy.exp = Math.min(0xFFFF, Math.round(enemy.exp * (bosses.includes(name) ? bossExpScale : expScale)));
        });
    }
}

module.exports = {initialise, clone, writeToRom, sortDjinn, scaleBattleRewards};
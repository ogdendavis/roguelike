/*
Possible future updates:
- IE compatibility (CSS width: fit-content in gameGoesHere not IE-friendly)
- "Smart" enemies that begin to chase player (every other turn?) if player gets too close to them
- General clean-up of code (particularly CSS)
- Gameplay balance tweaks (enemy health, leveling up, etc) to make it still challenging but more even throughout levels (right now, you level up a ton at higher levels and hardly at all on level 1)
- Map property tweaks to make it a little more spread out than current algorithm (play with allowed overlap in room builder, and globalMapProperties)
- Complicate the game by making enimies become 'active' when player gets close, so that they start to move
*/

//global "behind-the-scenes" settings that don't change in gameplay

const globalMapProperties = {
  cols: 80,
  rows: 80,
  floors: 2000,
  hallRatio: .3,
  maxRoomDimension: 20,
  minRoomDimension: 5,
  visibility: 6
}

const globalGameProperties = {
  levels: 4,
  enemies: 20,
  treasures: 10,
  weapons: 2,
  enemyHealth: 50,
  enemyPower: 15,
  enemyArmor: 15,
  treasureHealth: 50,
  weaponPower: 5,
  levelUpPower: 5,
  levelUpArmor: 10,
  levelUpHealth: 50,
  xpToLevelUp: 500,
  powerOnLevelUp: 5,
  armorOnLevelUp: 5
}


//Redux code

const defaultState = {
  floors: [],
  player: '',
  exit: '',
  weapons: [],
  treasures: [],
  enemies: [],
  level: 0,
  playerStats: {
    level: 1,
    health: 100,
    power: 10,
    armor: 10,
    xp: 0
  },
  enemyStats: {},
  boss: '',
  bossStats: {
    health: 200,
    power: 120,
    armor: 80
  },
  log: []
};

const CREATEMAP = 'CREATEMAP';
const POPULATELEVEL = 'POPULATELEVEL';
const RESET = 'RESET';
const NEXTLEVEL = 'NEXTLEVEL';

const PLAYERMOVE = 'PLAYERMOVE';
const NOEFFECT = 'NOEFFECT';
const PLAYERHEALTH = 'PLAYERHEALTH';
const NEWWEAPON = 'NEWWEAPON';
const FIGHT = 'FIGHT';
const BOSSFIGHT = 'BOSSFIGHT';
const DEFEATENEMY = 'DEFEATENEMY';
const GOODLOG = 'GOODLOG';
const BADLOG = 'BADLOG';

const createMap = () => {
  //from global settings
  const cols = globalMapProperties.cols;
  const rows = globalMapProperties.rows;
  const floors = globalMapProperties.floors;
  const hallRatio = globalMapProperties.hallRatio;
  const max = globalMapProperties.maxRoomDimension;
  const min = globalMapProperties.minRoomDimension;
  const totEnemies = globalGameProperties.enemies;
  const totTreasures = globalGameProperties.treasures;
  const totWeapons = globalGameProperties.weapons;

  //first, the hall "tunneler"
  const tunneler = () => {
    const midPoint = `${Math.floor(cols/2)}x${Math.floor(rows/2)}`;
    let directionSeed = Math.random();
    let direction;

    if (directionSeed < 0.25) {
      direction = 'UP';
    } else if (directionSeed >= 0.25 && directionSeed < 0.5) {
      direction = 'RIGHT';
    } else if (directionSeed >= 0.5 && directionSeed < 0.75) {
      direction = 'DOWN';
    } else if (directionSeed >= 0.75 && directionSeed <1) {
      direction = 'LEFT';
    }

    const hallArray = [midPoint];
    let startSpace, nextSpace, x, y, changeSeed, changeDir;

    while (hallArray.length < floors * hallRatio) {
      startSpace = hallArray[hallArray.length-1];

      x = (/^\d{1,}/).exec(startSpace)[0];
      y = (/\d{1,}$/).exec(startSpace)[0];

      //keeping it from going off the edge of the map. Corners first, then edges.
      if (x == 1 && y == 1) {
        x = Math.floor(cols*.25);
        y = Math.floor(rows*.25);
        if (Math.random() < 0.5) {
          direction = 'DOWN';
        } else {
          direction = 'RIGHT';
        }
      } else if (x == cols-2 && y == 1) {
        x = Math.floor(cols*.75);
        y = Math.floor(rows*.25);
        if (Math.random() < 0.5) {
          direction = 'LEFT';
        } else {
          direction = 'DOWN';
        }
      } else if (x == cols-2 && y == rows-2) {
        x = Math.floor(cols*.75);
        y = Math.floor(rows*.75);
        if (Math.random() < 0.5) {
          direction = 'UP';
        } else {
          direction = 'LEFT';
        }
      } else if (x == 1 && y == rows-2) {
        x = Math.floor(cols*.25);
        y = Math.floor(rows*.75);
        if (Math.random() < 0.5) {
          direction = 'UP';
        } else {
          direction = 'RIGHT';
        }
      } // end of corners. Now edges!
      else if (x == 1) {
        let rand = Math.random();
        if (rand < 0.2) {
          direction = 'UP';
        } else if (rand < 0.4) {
          direction = 'DOWN';
        } else {
          direction = 'RIGHT';
        }
      } else if (x == cols-2) {
        let rand = Math.random();
        if (rand < 0.2) {
          direction = 'UP';
        } else if (rand < 0.4) {
          direction = 'DOWN';
        } else {
          direction = 'LEFT';
        }
      } else if (y == 1) {
        let rand = Math.random();
        if (rand < 0.2) {
          direction = 'LEFT';
        } else if (rand < 0.4) {
          direction = 'RIGHT';
        } else {
          direction = 'DOWN';
        }
      } else if (y == 98) {
        let rand = Math.random();
        if (rand < 0.2) {
          direction = 'LEFT';
        } else if (rand < 0.4) {
          direction = 'RIGHT';
        } else {
          direction = 'UP';
        }
      } // if not on a corner or edge, change dir at random
      else {
        changeSeed = Math.random();
        if (changeSeed < 0.05) {
          changeDir = true;
        }
      }

      if (direction == 'UP') {
        y--;
        if (changeDir == true) {
          directionSeed = Math.random();
          if (directionSeed < 0.5) {
            direction = 'LEFT';
          } else {
            direction = 'RIGHT';
          }
          changeDir = false;
        }
      } else if (direction == 'RIGHT') {
        x++;
        if (changeDir == true) {
          directionSeed = Math.random();
          if (directionSeed < 0.5) {
            direction = 'UP';
          } else {
            direction = 'DOWN';
          }
          changeDir = false;
        }
      } else if (direction == 'DOWN') {
        y++;
        if (changeDir == true) {
          directionSeed = Math.random();
          if (directionSeed < 0.5) {
            direction = 'RIGHT';
          } else {
            direction = 'LEFT';
          }
          changeDir = false;
        }
      } else if (direction == 'LEFT') {
        x--;
        if (changeDir == true) {
          directionSeed = Math.random();
          if (directionSeed < 0.5) {
            direction = 'DOWN';
          } else {
            direction = 'UP';
          }
          changeDir = false;
        }
      }

      nextSpace = `${x}x${y}`;
      hallArray.push(nextSpace);
    }

    const noDupes = hallArray.filter((space, index, array) => {
      return array.indexOf(space) === index;
    })

    return (noDupes);
  } // end tunneler

  //now to make one room
  const addRoom = (x,y) => {
    const width = (Math.floor(Math.random()*(max-min))) + min;
    const height = (Math.floor(Math.random()*(max-min))) + min;
    const roomArray = [];
    for (let i=-1; i<width; i++) {
      for (let j=-1; j<height; j++) {
        roomArray.push(`${x+i}x${y-j}`);
      }
    }
    return roomArray;
    }

  //now to make all floor tiles
  const addAllFloors = () => {
    const halls = tunneler();
    const allFloors = [...halls];

    let spaceSeed, starterSpace, x, y;
    //to prevent 'infinite loop' crashes:
    let allowedOverlapPercent = 1;
    let iterations = 0;

    while (allFloors.length < floors) {
      spaceSeed = Math.floor(Math.random()*halls.length);
      starterSpace = halls[spaceSeed];

      x = Number((/^\d{1,}/).exec(starterSpace)[0]);
      y = Number((/\d{1,}$/).exec(starterSpace)[0]);

      //overlap tolerance increases over time, to allow escape from 'infinite loop' crashes
      iterations++;
      if (iterations == 20) {
        allowedOverlapPercent++;
        iterations = 0;
      }
      let allowedOverlap = floors * (allowedOverlapPercent/100);

      if (x > 1 && x < (cols-max-1) && y > (max-1) && y < (rows-3)) { //ensuring room fits on defined grid
        let possibleRoom = addRoom(x,y);
        let overlap = possibleRoom.filter(x => allFloors.indexOf(x) != -1);

        if (overlap.length <= allowedOverlap) {
          const noOverlap = possibleRoom.filter(pos => overlap.indexOf(pos) == -1);
          allFloors.push(...noOverlap);
        }
      }
    }

    return allFloors;
  }

  //put it all together and make the whole starting setup
  const makeGame = () => {
    const board = addAllFloors();
    const used = [];

    const playerSeed = Math.floor(Math.random() * (board.length-1));
    const player = board[playerSeed];
    used.push(playerSeed);

    const exitSeed = Math.floor(Math.random() * (board.length-1));
    let exit;
    if (exitSeed == playerSeed) {
      const half = Math.floor(board.length/2);
      if (exitSeed < half) {
        exit = board[exitSeed + half - 1];
        used.push(exitSeed + half - 1);
      } else if (exitSeed > half) {
        exit = board[exitSeed - half + 1];
        used.push(exitSeed - half + 1);
      } else if (exitSeed == half) {
        exit = board[exitSeed - (Math.floor(half/2))];
        used.push(exitSeed - (Math.floor(half/2)));
      }
    } else if (exitSeed != playerSeed) {
      exit = board[exitSeed];
      used.push(exitSeed);
    }

    let weaponSeed, weapon;
    const weapons = [];
    while (weapons.length < totWeapons) {
      weaponSeed = Math.floor(Math.random() * (board.length-1));
      if (used.indexOf(weaponSeed) == -1) {
        weapon = board[weaponSeed];
        weapons.push(weapon);
        used.push(weaponSeed);
      }
    }

    let treasureSeed, treasure;
    const treasures = [];
    while (treasures.length < totTreasures) {
      treasureSeed = Math.floor(Math.random() * (board.length-1));
      if (used.indexOf(treasureSeed) == -1) {
        treasure = board[treasureSeed];
        treasures.push(treasure);
        used.push(treasureSeed);
      }
    }

    let enemySeed, enemy;
    const enemies = [];
    while (enemies.length < totEnemies) {
      enemySeed = Math.floor(Math.random() * (board.length-1));
      if (used.indexOf(enemySeed) == -1) {
        enemy = board[enemySeed];
        enemies.push(enemy);
        used.push(enemySeed);
      }
    }

    return ({
      type: CREATEMAP,
      floors: board,
      player: player,
      exit: exit,
      weapons: weapons,
      treasures: treasures,
      enemies: enemies,
      level: 0,
      boss: '' //boss and level added to make reset work (because in a reset, the empty map object is passed directly to populateLevel, without going through reducer)
    });
  }

  return makeGame();
} // end createMap

const populateLevel = (mapState) => {
  //const previousState = store.getState(); changing to passing in previous state, with just empty map
  const baseHealth = globalGameProperties.enemyHealth;
  const basePower = globalGameProperties.enemyPower;
  const baseArmor = globalGameProperties.enemyArmor;

  const level = mapState.level + 1;

  const enemyStats = {};
  //enemy health by level: 1:50, 2:100, 3:150, 4:200
  const averageHealth = baseHealth * level;
  //goal power/armor averages: 1:15, 2:35, 3:55, 4:75
  const averagePower = (basePower * level) + (Math.floor(basePower/(globalGameProperties.levels-1) * (level-1)));
  const averageArmor = (baseArmor * level) + (Math.floor(baseArmor/(globalGameProperties.levels-1) * (level-1)));
  mapState.enemies.map(loc => {
    //randomly increase or decrease power & armor by 25%
    const powerSeed = (Math.random()*0.5) + 0.75;
    const armorSeed = (Math.random()*0.5) + 0.75;
    enemyStats[loc] = {
      health: averageHealth,
      power: Math.floor(powerSeed * averagePower),
      armor: Math.floor(armorSeed * averageArmor),
      active: false
    }
  });

  let boss = mapState.boss;
  let exit = mapState.exit;
  if (level == globalGameProperties.levels) { // put the boss in the last level, instead of the exit
    boss = mapState.exit;
    exit = '';
  }

  return ({
    type: POPULATELEVEL,
    level: level,
    enemyStats: enemyStats,
    exit: exit,
    boss: boss
  });
} // end populateLevel

const playerMove = (dir) => {
  const state = store.getState();
  const player = state.player;
  const floors = state.floors;
  const level = state.level;
  const treasures = state.treasures;
  const weapons = state.weapons;
  const enemies = state.enemies;
  const exit = state.exit;
  const boss = state.boss;

  const playerX = (/^\d{1,}/).exec(player)[0];
  const playerY = (/\d{1,}$/).exec(player)[0];

  let testX = Number(playerX);
  let testY = Number(playerY);

  if (dir == 'UP') {
    testY--;
  }
  else if (dir == 'RIGHT') {
    testX++;
  }
  else if (dir == 'DOWN') {
    testY++;
  }
  else if (dir == 'LEFT') {
    testX--;
  }

  const nextSpace = `${testX}x${testY}`;

  // walking into walls
  if (floors.indexOf(nextSpace) === -1) {
    return ({
      type: PLAYERMOVE,
      player: player,
      effect: {
        type: NOEFFECT
      }
    });
  }

  // picking up treasure
  if (treasures.indexOf(nextSpace) !== -1) {
    const healthGain = level * globalGameProperties.treasureHealth;
    const newHealth = state.playerStats.health + healthGain;
    return ({
      type: PLAYERMOVE,
      player: nextSpace,
      effect: {
        type: PLAYERHEALTH,
        value: newHealth,
        remove: nextSpace,
      },
      log: {
        type: GOODLOG,
        detail: 'You picked up some cleaning spplies!',
        value: `+${healthGain} cleaning solution.`
      }
    });
  }

  // picking up weapon
  if (weapons.indexOf(nextSpace) !== -1) {
    const newPower = state.playerStats.power + globalGameProperties.weaponPower;
    const mopUpgrades = ['a better mop head', 'an ergonomic handle', 'a self-propelling mop', 'a better bucket', 'a titanium mop stick', 'a two-headed mop', 'a sentient wizard mop like the brooms in Harry Potter', 'a stick of gum. No idea why this helps.', 'a sparkly disco ball for the top of your mop']
    let upgradeSeed = Math.floor(Math.random()*mopUpgrades.length);
    const mopUpgrade = mopUpgrades[upgradeSeed];
    return ({
      type: PLAYERMOVE,
      player: nextSpace,
      effect: {
        type: NEWWEAPON,
        value: newPower,
        remove: nextSpace
      },
      log: {
        type: GOODLOG,
        detail: `You picked up ${mopUpgrade}!`,
        value: `+${globalGameProperties.weaponPower} mop power.`
      }
    })
  }

  // fighting an enemy
  if (enemies.indexOf(nextSpace) !== -1) {
    const playerHealth = state.playerStats.health;
    const playerLevel = state.playerStats.level;
    const playerPower = state.playerStats.power;
    const playerArmor = state.playerStats.armor;

    const enemy = state.enemyStats[nextSpace];
    const enemyHealth = enemy.health;
    const enemyPower = enemy.power;
    const enemyArmor = enemy.armor;

    //To calc damage dealt/received: Damage giver's power, randomly modified up or down 50%, then reduced by a percentage based on the damage taker's armor (10 armor = 5% reduction, etc) up to
    let playerDamage = Math.floor(enemyPower*((Math.random()*.5)+1) * (1-(playerArmor/200)));
    if (playerDamage < 0) { playerDamage = 0 };
    let enemyDamage = Math.floor(playerPower*((Math.random()*.5)+1) * (1-(enemyArmor/200)));
    if (enemyDamage <= 0) { enemyDamage = 1 };
    let newHealth = playerHealth - playerDamage;
    let newEnemyHealth = enemyHealth - enemyDamage;

    // if player dies
    if (newHealth <= 0) {
      alert('You ran out of cleaning solution! This place will be filthy forever. Try again?');
      return reset(0);
    }
    // if player defeats enemy
    else if (newEnemyHealth <=0) {
      newHealth = playerHealth + enemyPower; // take no damage, get credit for enemy power
      let newPower = playerPower;
      let newArmor = playerArmor;
      let newLevel = playerLevel;

      const xpGained = enemyPower + enemyArmor;
      const newXp = state.playerStats.xp + xpGained;

      let detailMessage = 'You cleaned up a mess!';
      let valueMessage = `+${xpGained}xp`;

      let toNextLevel = (playerLevel * globalGameProperties.xpToLevelUp) - newXp;
      if (toNextLevel <= 0) {
        newLevel++;
        newPower = newPower + globalGameProperties.powerOnLevelUp;
        newArmor = newArmor + globalGameProperties.armorOnLevelUp;
        newHealth = newHealth + globalGameProperties.levelUpHealth;
        detailMessage = 'You leveled up!';
        valueMessage = `Level: ${newLevel}, Mop Power: ${newPower}, Dirt Resistance: ${newArmor}.`
        toNextLevel = toNextLevel + globalGameProperties.xpToLevelUp;
      }
      return ({
        type: PLAYERMOVE,
        player: nextSpace,
        effect: {
          type: DEFEATENEMY,
          xp: newXp,
          playerLevel: newLevel,
          playerHealth: newHealth,
          playerPower: newPower,
          playerArmor: newArmor,
          remove: nextSpace
        },
        log: {
          type: GOODLOG,
          detail: detailMessage,
          value: valueMessage
        }
      });
    }

    let enemyStrength;
    if (enemyPower >= playerPower) {
      enemyStrength = 'This is a tough stain!';
    } else if (enemyPower < playerPower) {
      enemyStrength = 'This will clean in a jiffy.';
    }
    return ({ // if neither player nor enemy dies
      type: PLAYERMOVE,
      player: player,
      effect: {
        type: FIGHT,
        playerHealth: newHealth,
        enemy: nextSpace,
        enemyHealth: newEnemyHealth
      },
      log: {
        type: BADLOG,
        detail: enemyStrength,
        value: `Cleaned up ${enemyDamage} bits of mess and used ${playerDamage} cleaning solution.`
      }
    });

  } // end fight

  // fighting the boss
  if (nextSpace === boss) {
    const playerHealth = state.playerStats.health;
    const playerLevel = state.playerStats.level;
    const playerPower = state.playerStats.power;
    const playerArmor = state.playerStats.armor;

    const bossHealth = state.bossStats.health;
    const bossPower = state.bossStats.power;
    const bossArmor = state.bossStats.armor;

    let playerDamage = Math.floor(bossPower*((Math.random()*.5)+1) * (1-(playerArmor/200)));
    if (playerDamage < 0) { playerDamage = 0 };
    let bossDamage = Math.floor(playerPower*((Math.random()*.5)+1) * (1-(bossArmor/200)));
    if (bossDamage <= 0) { bossDamage = 1 };
    let newHealth = playerHealth - playerDamage;
    let newBossHealth = bossHealth - bossDamage;

    // if player dies
    if (newHealth <= 0) {
      alert('You were defeated by the evil doctor! Let\'s try that again.');
      return reset(0);
    }
    // if player defeats boss
    else if (newBossHealth <= 0) {
      alert('You\'ve defeated evil, messy doctor! You win!');
      return reset();
    }
    // if neither boss nor player dies
    return ({ // if neither player nor enemy dies
      type: PLAYERMOVE,
      player: player,
      effect: {
        type: BOSSFIGHT,
        playerHealth: newHealth,
        bossHealth: newBossHealth
      },
      log: {
        type: BADLOG,
        detail: `You're fighting the evil doctor!`,
        value: `You dealt him ${bossDamage} damage by spraying ${playerDamage} cleaning solution in his eyes.`
      }
    });
  }

  // the exit
  if (nextSpace == exit) {
    return nextLevel(state);
  }

  return ({
    type: PLAYERMOVE,
    player: nextSpace,
    effect: {
      type: NOEFFECT
    }
  });
} // end playerMove

const reset = () => {
  const newMap = createMap();
  const newLevel = populateLevel(newMap);
  return ({
    type: RESET,
    state: {
      ...defaultState,
      floors: newMap.floors,
      player: newMap.player,
      weapons: newMap.weapons,
      treasures: newMap.treasures,
      enemies: newMap.enemies,
      level: newLevel.level,
      enemyStats: newLevel.enemyStats,
      exit: newLevel.exit,
      boss: newLevel.boss
    }
  });
} // end reset

const nextLevel = (currentState) => {
  const nextMap = createMap();
  nextMap.level = currentState.level;
  const nextLevel = populateLevel(nextMap);
  const startLog = [{
    type: GOODLOG,
    detail: `Welcome to level ${nextLevel.level}.`,
    value: 'Let\'s get this floor clean!'
  }]

  return ({
    type: RESET,
    state: {
      ...currentState,
      floors: nextMap.floors,
      player: nextMap.player,
      weapons: nextMap.weapons,
      treasures: nextMap.treasures,
      enemies: nextMap.enemies,
      level: nextLevel.level,
      enemyStats: nextLevel.enemyStats,
      exit: nextLevel.exit,
      boss: nextLevel.boss,
      log: startLog
    }
  })

} // end nextLevel

const mapReducer = (state = defaultState, action) => {
  switch (action.type) {
    case PLAYERMOVE:
      let newLog = state.log;
      if (action.log) {
        newLog.unshift(action.log);
        if (newLog.length > 5) {
          newLog.splice(5,1);
        }
      }
      switch (action.effect.type) {
        case NOEFFECT:
          return ({
            ...state,
            player: action.player
          });
        case PLAYERHEALTH:
          const newTreasures = state.treasures;
          newTreasures.splice(newTreasures.indexOf(action.effect.remove),1);
          return ({
            ...state,
            player: action.player,
            treasures: newTreasures,
            playerStats: {
              ...state.playerStats,
              health: action.effect.value
            },
            log: newLog
          });
        case NEWWEAPON:
          const newWeapons = state.weapons;
          newWeapons.splice(newWeapons.indexOf(action.effect.remove),1);
          return ({
            ...state,
            player: action.player,
            weapons: newWeapons,
            playerStats: {
              ...state.playerStats,
              power: action.effect.value
            },
            log: newLog
          });
        case FIGHT:
          return ({
            ...state,
            player: action.player,
            playerStats: {
              ...state.playerStats,
              health: action.effect.playerHealth
            },
            enemyStats: {
              ...state.enemyStats,
              [action.effect.enemy]: {
                ...state.enemyStats[action.effect.enemy],
                health: action.effect.enemyHealth
              }
            },
            log: newLog
          });
        case DEFEATENEMY:
          const newEnemies = state.enemies;
          newEnemies.splice(newEnemies.indexOf(action.effect.remove),1);
          return ({
            ...state,
            player: action.player,
            playerStats: {
              ...state.playerStats,
              level: action.effect.playerLevel,
              health: action.effect.playerHealth,
              power: action.effect.playerPower,
              armor: action.effect.playerArmor,
              xp: action.effect.xp
            },
            log: newLog
          });
        case BOSSFIGHT:
          return ({
            ...state,
            player: action.player,
            playerStats: {
              ...state.playerStats,
              health: action.effect.playerHealth
            },
            bossStats: {
              ...state.bossStats,
              health: action.effect.bossHealth
            },
            log: newLog
          });
        default:
          return ({
            ...state,
            player: action.player
          });
      } // end player move
      case CREATEMAP:
      return ({
        ...state,
        floors: action.floors,
        player: action.player,
        exit: action.exit,
        weapons: action.weapons,
        treasures: action.treasures,
        enemies: action.enemies,
        level: action.level,
        boss: action.boss
      });
    case POPULATELEVEL:
      return ({
        ...state,
        level: action.level,
        enemyStats: action.enemyStats,
        exit: action.exit,
        boss: action.boss
      });
    case RESET:
      return ({ ...action.state }); //built from defaultState in reset()
    case NEXTLEVEL:
      return ({ ...action.state }); //built from currentState in nextLevel(currentState)
    default:
      return state;
  }
}

const store = Redux.createStore(mapReducer);


////////////////////////////////////////////////////
//React

class Map extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: 0,
      cols: 0,
      rows: 0,
      lights: false,
      touch: {
        startX: null,
        startY: null,
        endX: null,
        endY: null
      }
    }

    this.drawSquare = this.drawSquare.bind(this);
    this.drawRow = this.drawRow.bind(this);
    this.drawMap = this.drawMap.bind(this);
    this.showGameInfo = this.showGameInfo.bind(this);
    this.hideGameInfo = this.hideGameInfo.bind(this);
    this.calculateVisible = this.calculateVisible.bind(this);
    this.hidePageLoadModal = this.hidePageLoadModal.bind(this);
    this.toggleLights = this.toggleLights.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouch = this.handleTouch.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  drawSquare(x,y) {
    const id = `${x}x${y}`;
    return (
      <span className = "square" id = {id} key = {id}  />
    );
  }

  drawRow(y, startCol, endCol) {
    const id = `row${y}`;
    const thisRow = [];
    for (let i=startCol; i<=endCol; i++) {
      thisRow.push(this.drawSquare(i,y));
    }
    return (
      <div className = "row" id = {id} key = {id}>{thisRow}</div>
    );
  }

  drawMap(cols, rows, player) {
    const playerX = Number((/^\d{1,}/).exec(player)[0]);
    const playerY = Number((/\d{1,}$/).exec(player)[0]);

    const halfCol = cols/2;
    let startCol = playerX - halfCol - 1;
    let endCol = playerX + halfCol - 1;

    const halfRow = rows/2;
    let startRow = playerY - halfRow - 1;
    let endRow = playerY + halfRow - 1;

    const allSquares = [];
    for (let j=startRow; j<=endRow; j++) {
      allSquares.push(this.drawRow(j,startCol,endCol));
    }
    return (
      <div className = "map" id = "map">{allSquares}</div>
    );
  }

  calculateVisible(player) {
    const playerX = Number((/^\d{1,}/).exec(player)[0]);
    const playerY = Number((/\d{1,}$/).exec(player)[0]);
    const visibleRange = globalMapProperties.visibility;

    const visible = [];

    //if lights are on
    if (this.state.lights) {
      const cols = this.state.cols;
      const rows = this.state.rows;

      const halfCol = cols/2;
      let startCol = playerX - halfCol - 1;
      let endCol = playerX + halfCol - 1;

      const halfRow = rows/2;
      let startRow = playerY - halfRow - 1;
      let endRow = playerY + halfRow - 1;

      for (let i=startRow; i<=endRow; i++) {
        for (let j=startCol; j<=endCol; j++) {
          visible.push(`${j}x${i}`);
        }
      }
      return visible;
    } // end if lights are on

    //lights off -- normal case

    //drawing the first column, on playerX
    for (let i=0; i<=visibleRange; i++) {
      visible.push(`${playerX}x${playerY + i}`);
      visible.push(`${playerX}x${playerY - i}`);
    }

    // drawing all other columns, tapering to form a blunt-ended diamond of a view
    for (let j=1; j<=visibleRange; j++) {
      let colEnd = visibleRange - j + 1;
      for (let k=0; k<=colEnd; k++) {
        visible.push(`${playerX + j}x${playerY + k}`);
        visible.push(`${playerX - j}x${playerY - k}`);
        visible.push(`${playerX + j}x${playerY - k}`);
        visible.push(`${playerX - j}x${playerY + k}`);
      }
    }

    //eliminate duplicates in visible array
    const noDupes = visible.filter((space, index, array) => {
      return array.indexOf(space) === index;
    });

    return noDupes;
  }

  showGameInfo() {
    document.getElementById('gameInfoModal').style.display = 'block';
    document.getElementById('gameInfoModalBackground').addEventListener('click', this.hideGameInfo);
  }

  hideGameInfo() {
    document.getElementById('gameInfoModalBackground').removeEventListener('click', this.hideGameInfo);
    document.getElementById('gameInfoModal').style.display = 'none';
  }

  hidePageLoadModal() {
    document.getElementById('pageLoadModal').style.display = 'none';
  }

  toggleLights() {
    let toggled = !this.state.lights;
    this.setState({
      lights: toggled
    });
  }

  handleKeydown(event) {
    let dir;

    switch (event.keyCode) {
      case 38:
        event.preventDefault();
        dir = 'UP';
        break;
      case 39:
        event.preventDefault();
        dir = 'RIGHT';
        break;
      case 40:
        event.preventDefault();
        dir = 'DOWN';
        break;
      case 37:
        event.preventDefault();
        dir = 'LEFT';
        break;
      case 32:
        event.preventDefault();
        return null;
      default:
        return null;
    }

    this.props.playerMove(dir);
  }

  handleTouchStart(event) {
    event.preventDefault();
    const startX = event.changedTouches[0].screenX;
    const startY = event.changedTouches[0].screenY;
    this.setState({
      touch: {
        startX: startX,
        startY: startY
      }
    });
  }

  handleTouchEnd(event) {
    event.preventDefault();
    const endX = event.changedTouches[0].screenX;
    const endY = event.changedTouches[0].screenY;
    const currentState = this.state.touch;
    currentState.endX = endX;
    currentState.endY = endY;
    this.setState({
      touch: currentState
    });
    this.handleTouch();
  }

  handleTouch() {
    const startX = this.state.touch.startX;
    const startY = this.state.touch.startY;
    const endX = this.state.touch.endX;
    const endY = this.state.touch.endY;

    const diffX = startX - endX;
    const diffY = startY - endY;

    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    if (absX > absY && diffX > 0) {
      this.props.playerMove('RIGHT');
    }
    else if (absX > absY && diffX < 0) {
      this.props.playerMove('LEFT');
    }
    else if (absY > absX && diffY > 0) {
      this.props.playerMove('DOWN');
    }
    else if (absY > absX && diffY < 0) {
      this.props.playerMove('UP');
    }

  }

  handleClick(event) {
    const id = event.target.id;
    let dir;
    if (id == 'cpTopMid') {
      dir = 'UP';
    } else if (id == 'cpMidLeft') {
      dir = 'LEFT';
    } else if (id == 'cpMidRight') {
      dir = 'RIGHT';
    } else if (id == 'cpBotMid') {
      dir = 'DOWN';
    }
    this.props.playerMove(dir);
  }

  componentWillMount() {
    this.props.createMap();
    const emptyMap = store.getState();
    this.props.populateLevel(emptyMap);
    const width = screen.width;
    const visibleBox = (globalMapProperties.visibility * 2) + 1;
    let displayCols, displayRows;
      if (width < 850) {
        //set display for phones & small tablets
        displayCols = visibleBox + 1;
        displayRows = visibleBox + 1;
      }
      else {
        //set display for computers & large tablets
        displayCols = Math.floor(visibleBox * 1.5);
        displayRows = Math.floor(visibleBox * 1.25);
      }
    if (displayCols % 2 == 1) {
      displayCols++;
    }
    if(displayRows %2 == 1) {
      displayRows++;
    }
    this.setState({
      width: width,
      cols: displayCols,
      rows: displayRows
    });
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeydown);
    document.getElementById('map').addEventListener('touchstart', this.handleTouchStart);
    document.getElementById('map').addEventListener('touchend', this.handleTouchEnd);
    const pageLoadModal = document.getElementById('pageLoadModal');
    pageLoadModal.style.display = 'block';
    pageLoadModal.addEventListener('click', this.hidePageLoadModal);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    document.getElementById('map').removeEventListener('touchstart', this.handleTouchStart);
    document.getElementById('map').removeEventListener('touchend', this.handleTouchEnd);
    document.getElementById('pageLoadModal').removeEventListener('click', this.hidePageLoadModal);
  }

  componentDidUpdate() {
    // remove old classes
    const classes = ['FLOOR', 'PLAYER', 'ENEMY', 'TREASURE', 'WEAPON', 'EXIT', 'BOSS', 'WALL'];
    classes.map(thisClass => {
      const elements = document.getElementsByClassName(thisClass);
      while (elements.length > 0) {
        document.getElementById(elements[0].id).classList.remove(thisClass);
      }
    });

    //determine visible cells
    const visible = this.calculateVisible(this.props.player);

    // add classes back in to visible cells
    const floors = this.props.floors.filter(x => visible.indexOf(x) != -1);
    floors.map(x => {
      const floorTile = document.getElementById(x);
      if (floorTile) {
        floorTile.classList.add('FLOOR')
      }
    });

    const player = document.getElementById(this.props.player);
    if (player) {
      player.classList.add('PLAYER');
    }

    const exit = document.getElementById(this.props.exit);
    if (visible.indexOf(this.props.exit) != -1 && exit) {
      exit.classList.add('EXIT');
    }

    const weapons = this.props.weapons.filter(y => visible.indexOf(y) != -1);
    weapons.map(wep => {
      const weapon = document.getElementById(wep);
      if (weapon) {
        weapon.classList.add('WEAPON')
      }
    });

    const treasures = this.props.treasures.filter(z => visible.indexOf(z) != -1);
    treasures.map(tre => {
      const treasure = document.getElementById(tre);
      if (treasure) {
        treasure.classList.add('TREASURE')
      }
    });

    const enemies = this.props.enemies.filter(q => visible.indexOf(q) != -1);
    enemies.map(ene => {
      const enemy = document.getElementById(ene);
      if (enemy) {
        enemy.classList.add('ENEMY')
      }
    });

    const boss = document.getElementById(this.props.boss);
    if (visible.indexOf(this.props.boss) != -1 && boss) {
      boss.classList.add('BOSS');
    }

    const walls = visible.filter(w => floors.indexOf(w) == -1);
    walls.map(wall => {
      const thisWall = document.getElementById(wall)
      if (thisWall) {
        thisWall.classList.add('WALL');
      }
    });
  }

  render() {
    let map;
    if (this.props.floors.length > 0) {
      map = this.drawMap(this.state.cols, this.state.rows, this.props.player);
    } else {
      map = this.drawMap(1, 1, '50x50');
    }

    const xpToLevel = this.props.playerStats.level * globalGameProperties.xpToLevelUp - this.props.playerStats.xp;

    const log = this.props.log;
    const logList = log.map(entry => {return (
      <div className = {entry.type}>
        <div>{entry.detail}</div>
        <div>{entry.value}</div>
      </div>
    )});
    const displayLog = <div className = "log">{logList}</div>;

    const pageLoadModal = (
      <div className = "modalBackground">
        <div className = "modalContent">
          <div className = "header">
            Welcome to Sacred Heart!
          </div>
          <div>
            <p>You are Ján Ĩtor, the custodial engineer at a large hospital. You must clean all the messes (<span style = {{color: '#FF0000'}}>red blocks</span>) in the hospital, using your trusty mop and cleaning solution (<span style = {{color: '#00CC00'}}>green blocks</span>). If you run out of cleaning solution, you can't clean any more and the game is over!</p>
            <p>You may upgrade your mop by adding accessories (<span style = {{color: '#FF7400'}}>orange blocks</span>) to it. You earn experience points for cleaning messes, and your mop and dirt-resistant gloves are also upgraded whenever you level up. After you've cleaned a floor, you may proceed to the next floor via the elevator (<span style = {{color: '#CD0074'}}>purple blocks</span>).</p>
            <p>Your ultimate goal is to find the disrespectful doctor who you belive has been making all these messes (<span style = {{color: '#8C0953'}}>purple block</span> with black outline), and defeat him (her?) in single combat. The messy doctor is on level 4 of the hospital.</p>
          </div>
        </div>
      </div>
    );

    const gameInfoModal = (
      <div className = "modalBackground" id = "gameInfoModalBackground">
        <div className = "modalContent">
          <div className = "leftColumn">
            <table>
              <tr><th>Key:</th></tr>
              <tr>
                <td>You (Janitor):</td>
                <td><span className = "square PLAYERfaker" /></td>
              </tr>
              <tr>
                <td>Mess (enemy):</td>
                <td><span className = "square ENEMYfaker" /></td>
              </tr>
              <tr>
                <td>Cleaning supplies:</td>
                <td><span className = "square TREASUREfaker" /></td>
              </tr>
              <tr>
                <td>Mop upgrade:</td>
                <td><span className = "square WEAPONfaker" /></td>
              </tr>
              <tr>
                <td>Elevator to next floor:</td>
                <td><span className = "square EXITfaker" /></td>
              </tr>
              <tr>
                <td>Doctor (boss):</td>
                <td><span className = "square BOSSfaker" /></td>
              </tr>
            </table>
          </div>
          <div className = "rightColumn">
            <ul>
              <li>Clean messes (kill enemies) to level up.</li>
              <li>Collect cleaning supplies and mop upgrades to improve stats.</li>
              <li>Take the elevator to go to the next floor (level)</li>
              <li>Defeat the evil doctor on level 4 to win the game!</li>
            </ul>
          </div>
        </div>
      </div>
    );

    const controlPad = (
      <div className = "controlPad">
        <div className = "cpSquare" id = "cpTopLeft" />
        <div className = "cpSquare" id = "cpTopMid" onClick = {this.handleClick} />
        <div className = "cpSquare" id = "cpTopRight" />
        <div className = "cpSquare" id = "cpMidLeft" onClick = {this.handleClick} />
        <div className = "cpSquare" id = "cpMidMid" />
        <div className = "cpSquare" id = "cpMidRight" onClick = {this.handleClick} />
        <div className = "cpSquare" id = "cpBotLeft" />
        <div className = "cpSquare" id = "cpBotMid" onClick = {this.handleClick} />
        <div className = "cpSquare" id = "cpBotRight" />
      </div>
    );

    return (
      <div className = "gameGoesHere">
        <div className = "levelInfo header">
          Welcome to Level {this.props.level}
        </div>
        <div className = "pageLoadModal modal" id = "pageLoadModal">
          {pageLoadModal}
        </div>
        <div className = "gameInfoModal modal" id = "gameInfoModal">
          {gameInfoModal}
        </div>
        <div className = "gameInfo">
          <button onClick = {this.showGameInfo} style = {{fontWeight: 900}}>?</button>
          <br />
          <button onClick = {this.toggleLights}>&#x1F4A1;</button>
        </div>
        {controlPad}
        <div className = "playerStats">
          <table>
            <tr><th colSpan = {2}>Your Stats:</th></tr>
            <tr><td>Level:</td> <td>{this.props.playerStats.level}</td></tr>
            <tr><td>Cleaning Solution:</td> <td>{this.props.playerStats.health}</td></tr>
            <tr><td>Mop Power:</td> <td>{this.props.playerStats.power}</td></tr>
            <tr><td>Dirt Resistance:</td> <td>{this.props.playerStats.armor}</td></tr>
            <tr><td>Level up in:</td> <td>{xpToLevel}xp</td></tr>
          </table>
        </div>
        {map}
        {displayLog}
      </div>
    );
  }
} // end Map

const Footer = () => {
  return (
    <div className = "footer">
      <span id = "signed">A <a href = "https://www.freecodecamp.org/" target = "_blank">FCC</a> pen by <a href = "https://codepen.io/ogdendavis/" target = "_blank">Lucas</a></span>
    </div>
  );
}


////////////////////////////////////////////////////
//Connecting React to Redux

const mapStateToProps = (state) => {
  return ({
    floors: state.floors,
    player: state.player,
    exit: state.exit,
    weapons: state.weapons,
    treasures: state.treasures,
    enemies: state.enemies,
    level: state.level,
    playerStats: state.playerStats,
    enemyStats: state.enemyStats,
    boss: state.boss,
    bossStats: state.bossStats,
    log: state.log
  });
};

const mapDispatchToProps = (dispatch) => {
  return ({
    createMap: () => { dispatch(createMap()); },
    populateLevel: (mapState) => { dispatch(populateLevel(mapState)); },
    playerMove: (dir) => { dispatch(playerMove(dir)); },
    reset: () => { dispatch(reset()); },
    nextLevel: (currentState) => { dispatch(nextLevel(currentState)); }
  });
};


/////////////////////////////////////////////////
//Rendering!
const Provider = ReactRedux.Provider;
const Container = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Map);

class Wrapper extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <Provider store = {store}>
          <Container />
        </Provider>
        <Footer />
      </div>
    );
  }
}

ReactDOM.render(<Wrapper />, document.getElementById("gameGoesHere"));

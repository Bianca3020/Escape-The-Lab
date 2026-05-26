const TILE = 40;

function buildBorderWalls() {
  const walls = [];
  for (let x = 0; x < 20; x++) {
    walls.push({ x, y: 0 });
    walls.push({ x, y: 14 });
  }
  for (let y = 1; y < 14; y++) {
    walls.push({ x: 0, y });
    walls.push({ x: 19, y });
  }
  return walls;
}

function rowWall(y, x1, x2) {
  const w = [];
  for (let x = x1; x <= x2; x++) w.push({ x, y });
  return w;
}

function colWall(x, y1, y2) {
  const w = [];
  for (let y = y1; y <= y2; y++) w.push({ x, y });
  return w;
}

const LEVELS = [
  {
    title: 'LAB SECTOR A',
    hint: 'Find the keycard, then reach the door',
    playerStart: { x: 2, y: 7 },
    keycard: { x: 16, y: 7 },
    door:    { x: 18, y: 7 },
    robots:  [],
    walls: buildBorderWalls().concat([
      { x:8,y:4},{x:8,y:5},{x:8,y:6},
      { x:8,y:8},{x:8,y:9},{x:8,y:10},
      {x:14,y:4},{x:14,y:5},{x:14,y:6},
      {x:14,y:8},{x:14,y:9},{x:14,y:10},
    ])
  },
{
  title: 'LAB SECTOR B',
  hint: 'Navigate the maze — watch your steps',

  playerStart: { x: 1, y: 1 },
  keycard: { x: 17, y: 12 },
  door: { x: 18, y: 1 },
  robots: [],
  walls: buildBorderWalls().concat([
  ...rowWall(3, 1, 6),
  ...rowWall(3, 9, 17),
  ...colWall(5, 4, 9),  
  ...colWall(9, 1, 4),
  ...rowWall(7, 3, 8),    
  ...rowWall(7, 10, 11),
  ...colWall(14, 5, 10),
  ...rowWall(11, 1, 7),
  ...rowWall(11, 10, 16),
    { x: 7, y: 5 },
    { x: 7, y: 6 },
    { x: 11, y: 8 },
    { x: 11, y: 9 },
    { x: 4, y: 13 },
    { x: 5, y: 13 },
    { x: 16, y: 5 },
    { x: 16, y: 6 }

  ])
},

  {
    title: 'LAB SECTOR C',
    hint: 'A patrol robot is active — avoid it!',
    playerStart: { x: 1, y: 7 },
    keycard: { x: 10, y: 2 },
    door:    { x: 18, y: 7 },
    robots: [
      { x:10, y:7, dir:'horizontal', speed:120 }
    ],
    walls: buildBorderWalls().concat([
      ...rowWall(4,3,8), ...rowWall(10,3,8), ...rowWall(4,12,17),
      {x:8,y:5},{x:8,y:6},{x:8,y:7},{x:8,y:8},{x:8,y:9},
      {x:13,y:5},{x:13,y:6},{x:13,y:8},{x:13,y:9},
    ])
  },

  {
    title: 'LAB SECTOR D',
    hint: 'Warning: Advanced Chase AI Active!',
    playerStart: { x: 2, y: 2 },
    keycard: { x: 17, y: 2 },
    door: { x: 17, y: 12 },
    robots: [
      { x: 6,  y: 6,  dir:'chaser', speed:90 },
      { x: 13, y: 10, dir:'chaser', speed:90 }
    ],
    walls: buildBorderWalls().concat([
      ...rowWall(4, 2, 7),
      ...rowWall(4, 10, 17),
      ...colWall(8, 2, 9),
      ...colWall(12, 5, 12),
      ...rowWall(10, 2, 8),
      ...rowWall(10, 11, 17),
      ...rowWall(7, 5, 14),
    ])
  },

  {
    title: 'MAIN CONTROL ROOM',
    hint: 'Final Area: Multiple pursuers tracking your position!',
    playerStart: { x: 1, y: 1 },
    keycard: { x: 2, y: 12 },
    door:    { x: 18, y: 13 },
    robots: [
      { x:4,  y:5,  dir:'chaser', speed:100 },
      { x:15, y:3,  dir:'chaser', speed:100 },
      { x:12, y:10, dir:'chaser', speed:100 }
    ],
    walls: buildBorderWalls().concat([
    ...rowWall(3,1,7),
    ...rowWall(3,12,18),
    ...colWall(6,5,10),
    ...colWall(10,2,6),
    ...colWall(10,9,13),
    ...colWall(15,4,10),
    ...rowWall(11,2,7),
    ...rowWall(11,12,17),
      {x:5,y:7},{x:6,y:7},
    ])
  },  
];
const line = {
  id: '',
  name: '',
  joints: [],
  style: {
    stroke: '',
    strokeWidth: 2,
    fill: '',
    isDashed: true,
    dashArray: '5, 5',
    isRoundCorner: false,
    roundCornerRadius: 10,
  },
  info: {
    descriptions: []
  }
}

const station = {
  id: '',
  name: '',
  englishName: '',
  points: [],
  namePos: {},
  englishNamePos: {},
  style: {
    stroke: '',
    strokeWidth: 2,
    fill: '',
    radius: 10,
  },
  info: {
    'line1': {},
    'line2': {},
    entrance: {},
  }
}
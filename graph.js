class Station {
  constructor (name) {
    this.name = name
    this.neighbors = []
  }

  addNeighbor (station, distance) {
    this.neighbors.push({ station, distance })
  }

  // BFS
  isReachable (stationName) {
    const visited = new Set()
    const queue = [this]
    while (queue.length > 0) {
      const current = queue.shift()
      if (current.station.name === stationName) return true
      if (visited.has(current)) continue
      visited.add(current)
      queue.push(...current.station.neighbors.map(neighbor => ({ station: neighbor.station, distance: current.distance + neighbor.distance })))
    }
    return false
  }

  fixPrecision(num) {
    // 先转数字，再乘以1000转整数，避免浮点误差，最后转回小数
    return Math.round(Number(num) * 1000) / 1000;
  }

  // 核心方法：计算到目标站点的最短距离
  distanceTo (stationName) {
    // 1. 边界条件：目标是当前站点，距离为 0
    if (this.name === stationName) {
      return 0;
    }

    // 2. 初始化距离表：key 是站点名称，value 是当前最短距离
    const distances = {};
    // 记录已访问的节点（避免重复计算）
    const visited = new Set();
    // 所有待处理的节点队列（用数组模拟优先队列）
    const queue = [];

    // 初始化：当前站点距离为 0，其他为无穷大
    distances[this.name] = 0;
    queue.push(this);

    // 3. 迪杰斯特拉核心逻辑
    while (queue.length > 0) {
      // 3.1 找到队列中距离最小的未访问节点
      let currentStation = null;
      let minDistance = Infinity;
      for (const station of queue) {
        if (!visited.has(station.name) && distances[station.name] < minDistance) {
          minDistance = distances[station.name];
          currentStation = station;
        }
      }

      // 无可达节点，退出循环
      if (!currentStation) break;

      // 标记为已访问
      visited.add(currentStation.name);

      // 3.2 遍历当前节点的邻接节点，更新距离
      for (const neighbor of currentStation.neighbors) {
        const neighborStation = neighbor.station;
        const neighborName = neighborStation.name;
        const newDistance = distances[currentStation.name] + neighbor.distance;

        // 初始化邻接节点的距离（首次访问）
        if (distances[neighborName] === undefined) {
          distances[neighborName] = Infinity;
        }

        // 如果新路径更短，更新距离
        if (newDistance < distances[neighborName]) {
          distances[neighborName] = newDistance;
          // 邻接节点未入队则加入
          if (!queue.includes(neighborStation)) {
            queue.push(neighborStation);
          }
        }

        // 提前终止：找到目标节点时可直接返回（可选优化）
        if (neighborName === stationName) {
          return this.fixPrecision(distances[stationName]);
        }
      }
    }

    // 4. 处理结果：存在目标节点返回距离，否则返回 null（表示不可达）
    const result = distances[stationName] !== undefined ? distances[stationName] : null;
    return result !== null ? this.fixPrecision(result) : null;
  }

  priceTo (stationName) {
    const distance = this.distanceTo(stationName)
    let price = 2
    if (distance > 24) price = 2 + 2 + 2 + Math.ceil((distance - 24) / 8)
    else if (distance > 12) price = 2 + 2 + Math.ceil((distance - 12) / 6)
    else if (distance > 4) price = 2 + Math.ceil((distance - 4) / 4)
    return price
  }
}

const graphData = [
  '前海湾-0.881-鲤鱼门-1.222-大新-1.01-桃园-2.26-深大-1.123-高新园-1.38-白石洲',
  '桃园-0.847-南山-0.945-南光-0.844-南油-1.156-四海-0.745-花果山-1.092-海上世界-1.56-太子湾-1.163-左炮台东',
  '前海湾-3.872-南山-2.046-后海-3.385-红树湾南-5.94-车公庙'
]

const stations = []
for (const line of graphData) {
  const data = line.split('-')
  for (let i = 0; i < data.length; i+=2) {
    if (!stations.find(station => station.name === data[i])) {
      stations.push(new Station(data[i]))
    }
  }
  for (let i = 1; i < data.length; i+=2) {
    const station1 = stations.find(station => station.name === data[i - 1])
    const station2 = stations.find(station => station.name === data[i + 1])
    station1.addNeighbor(station2, Number(data[i]))
    station2.addNeighbor(station1, Number(data[i]))
  }
}

const nanshan = stations.find(station => station.name === '南山')
// 分别计算南山到其他站的距离和价格
stations.forEach(station => {
  console.log(`${station.name}: 距离 ${nanshan.distanceTo(station.name)}, 价格 ${nanshan.priceTo(station.name)}`)
})

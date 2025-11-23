import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

const InteractiveStallMap = ({ stalls, onStallSelect, selectedStall, userRole }) => {
  const [hoveredStall, setHoveredStall] = useState(null);

  const mapWidth = 800;
  const mapHeight = 600;

  const roads = [
    { x: 0, y: 200, width: mapWidth, height: 60, type: 'horizontal', name: 'Main Street' },
    { x: 0, y: 400, width: mapWidth, height: 60, type: 'horizontal', name: 'Market Avenue' },
    { x: 250, y: 0, width: 60, height: mapHeight, type: 'vertical', name: 'Commerce Lane' },
    { x: 550, y: 0, width: 60, height: mapHeight, type: 'vertical', name: 'Trade Boulevard' }
  ];

  const stallBlocks = [
    { block: 'A', x: 50, y: 50, rows: 3, cols: 3, startId: 0 },
    { block: 'B', x: 350, y: 50, rows: 3, cols: 3, startId: 9 },
    { block: 'C', x: 50, y: 280, rows: 2, cols: 4, startId: 18 },
    { block: 'D', x: 650, y: 280, rows: 2, cols: 3, startId: 26 },
    { block: 'E', x: 50, y: 480, rows: 2, cols: 3, startId: 32 },
    { block: 'F', x: 350, y: 480, rows: 2, cols: 4, startId: 38 }
  ];

  const getStallPosition = (index) => {
    for (const block of stallBlocks) {
      if (index >= block.startId && index < block.startId + (block.rows * block.cols)) {
        const localIndex = index - block.startId;
        const row = Math.floor(localIndex / block.cols);
        const col = localIndex % block.cols;
        return {
          x: block.x + (col * 55),
          y: block.y + (row * 55),
          block: block.block
        };
      }
    }
    return { x: 0, y: 0, block: 'Z' };
  };

  const getStallColor = (stall) => {
    if (!stall) return '#94a3b8';
    if (selectedStall?.id === stall.id) return '#3b82f6';
    if (stall.status === 'AVAILABLE') return '#10b981';
    if (stall.status === 'RESERVED') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-xl border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
            <MapPin className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800"> Book Stalls Layout</h3>
            <p className="text-slate-600 text-xs">Click any stall to view details</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-slate-700">Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-700">Unavailable</span>
          </div>
        </div>
      </div>

      <div className="relative bg-white rounded-xl p-4 shadow-inner overflow-auto">
        <svg width={mapWidth} height={mapHeight} className="border border-slate-200 rounded-lg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
            </pattern>
            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#64748b', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#475569', stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: '#64748b', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>

          <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

          {roads.map((road, idx) => (
            <g key={idx}>
              <rect
                x={road.x}
                y={road.y}
                width={road.width}
                height={road.height}
                fill="url(#roadGradient)"
                stroke="#475569"
                strokeWidth="2"
              />
              {road.type === 'horizontal' ? (
                <>
                  <line
                    x1={road.x}
                    y1={road.y + road.height / 2}
                    x2={road.x + road.width}
                    y2={road.y + road.height / 2}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="20,10"
                  />
                  <text
                    x={road.x + road.width / 2}
                    y={road.y + road.height / 2 + 5}
                    textAnchor="middle"
                    fill="#1e293b"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {road.name}
                  </text>
                </>
              ) : (
                <>
                  <line
                    x1={road.x + road.width / 2}
                    y1={road.y}
                    x2={road.x + road.width / 2}
                    y2={road.y + road.height}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="20,10"
                  />
                  <text
                    x={road.x + road.width / 2}
                    y={road.y + road.height / 2}
                    textAnchor="middle"
                    fill="#1e293b"
                    fontSize="11"
                    fontWeight="600"
                    transform={`rotate(-90, ${road.x + road.width / 2}, ${road.y + road.height / 2})`}
                  >
                    {road.name}
                  </text>
                </>
              )}
            </g>
          ))}

          {stallBlocks.map((block, idx) => (
            <rect
              key={idx}
              x={block.x - 5}
              y={block.y - 5}
              width={block.cols * 55 + 10}
              height={block.rows * 55 + 10}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="5,5"
              rx="8"
            />
          ))}

          {stallBlocks.map((block, idx) => (
            <text
              key={`label-${idx}`}
              x={block.x + (block.cols * 55) / 2}
              y={block.y - 15}
              textAnchor="middle"
              fill="#475569"
              fontSize="14"
              fontWeight="700"
            >
              Block {block.block}
            </text>
          ))}

          {stalls.map((stall, index) => {
            const pos = getStallPosition(index);
            const color = getStallColor(stall);
            const isHovered = hoveredStall === stall.id;
            const isSelected = selectedStall?.id === stall.id;
            const isClickable = stall.status === 'AVAILABLE' && userRole === 'VENDOR';

            return (
              <g key={stall.id}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width="50"
                  height="50"
                  fill={color}
                  stroke={isSelected ? '#1e40af' : isHovered ? '#3b82f6' : '#e2e8f0'}
                  strokeWidth={isSelected ? '4' : isHovered ? '3' : '2'}
                  rx="6"
                  style={{
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    filter: isHovered || isSelected ? 'brightness(1.1)' : 'none'
                  }}
                  onMouseEnter={() => setHoveredStall(stall.id)}
                  onMouseLeave={() => setHoveredStall(null)}
                  onClick={() => onStallSelect(stall)}
                />
                <text
                  x={pos.x + 25}
                  y={pos.y + 22}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="700"
                  style={{ pointerEvents: 'none' }}
                >
                  {stall.stallName}
                </text>
                <text
                  x={pos.x + 25}
                  y={pos.y + 35}
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  ${stall.price}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default InteractiveStallMap;
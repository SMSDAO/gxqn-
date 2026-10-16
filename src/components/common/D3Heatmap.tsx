import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MarketSnapshot } from '../../services/marketProvider';

interface HeatmapProps {
  data: MarketSnapshot[];
  onSelect: (symbol: string) => void;
}

export const D3Heatmap: React.FC<HeatmapProps> = ({ data, onSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 20, left: 40 };

    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([-10, 10]); // Percentage change range

    const gridSize = Math.sqrt(data.length);
    const cellSize = Math.min(width / gridSize, height / gridSize) - 5;

    data.forEach((d, i) => {
      const x = (i % Math.ceil(gridSize)) * (cellSize + 5);
      const y = Math.floor(i / Math.ceil(gridSize)) * (cellSize + 5);

      svg.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 4)
        .attr('fill', colorScale(d.change24h))
        .attr('cursor', 'pointer')
        .on('mouseover', (event) => {
          d3.select(event.currentTarget as Element).attr('stroke', '#fff').attr('stroke-width', 2);
          // Optional: Show tooltip
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget as Element).attr('stroke', 'none');
        })
        .on('click', () => onSelect(d.symbol));

      svg.append('text')
        .attr('x', x + cellSize / 2)
        .attr('y', y + cellSize / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .text(d.baseAsset)
        .attr('pointer-events', 'none');
    });

  }, [data, onSelect]);

  return <svg ref={svgRef} width="100%" height="300" viewBox="0 0 600 300" />;
};

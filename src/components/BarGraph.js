import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './BarGraph.css';

function BarGraph({ data }) {
  const svgRef = useRef(null);
  const [groupBy, setGroupBy] = useState('Regulation Status'); // Default grouping by Regulation Status

  useEffect(() => {
    if (!data || data.length === 0) return;
    const industries = [...new Set(data.map(d => d.Industry))].sort();
    const groupValues = [...new Set(data.map(d => d[groupBy]))].sort();
    const aggregatedData = industries.map(industry => {
      const counts = groupValues.reduce((acc, value) => {
        acc[value] = data.filter(d => d.Industry === industry && d[groupBy] === value).length;
        return acc;
      }, {});
      return { industry, ...counts };
    });

    const margin = { top: 40, right: 250, bottom: 100, left: 50 }; // Increased right margin for legend
    const baseWidth = 800;
    const height = 400 - margin.top - margin.bottom;
    const totalWidth = baseWidth + margin.right; // Total width including right margin

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3
        .select(svgRef.current)
        .attr('width', totalWidth + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.append('text')
        .attr('x', totalWidth / 2)
        .attr('y', -margin.top/3)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(`Count of Industries by ${groupBy}`);

    const svgNode = svgRef.current;
    const containerWidth = svgNode.clientWidth || baseWidth;
    const width = containerWidth - margin.left - margin.right;

    const x0 = d3.scaleBand()
      .domain(industries)
      .range([0, width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(groupValues)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(aggregatedData, d => d3.max(groupValues, key => d[key]))])
      .range([height, 0])
      .nice();

    const color = d3.scaleOrdinal()
      .domain(groupValues)
      .range(d3.schemeCategory10);

    svg.selectAll('.industry')
      .data(aggregatedData)
      .enter()
      .append('g')
      .attr('class', 'industry')
      .attr('transform', d => `translate(${x0(d.industry)},0)`)
      .selectAll('rect')
      .data(d => groupValues.map(key => ({ key, value: d[key] })))
      .enter()
      .append('rect')
      .attr('x', d => x1(d.key))
      .attr('y', d => y(d.value))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d.value))
      .attr('fill', d => color(d.key));

    //X-axis
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    //Y-axis
    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('fill', '#000')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .text('Count');

    //Legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 50}, 0)`);

    legend.selectAll('rect')
      .data(groupValues)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 20)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => color(d));

    legend.selectAll('text')
      .data(groupValues)
      .enter()
      .append('text')
      .attr('x', 25)
      .attr('y', (d, i) => i * 20 + 12)
      .style('font-size', '12px')
      .attr('text-anchor', 'start')
      .text(d => d);

  }, [data, groupBy]);

  return (
    <div className="bar-graph" style={{ width: '100%', maxWidth: '1000px' }}>
      <div>
        <label>Group By: </label>
        <select value={groupBy} onChange={e => setGroupBy(e.target.value)}>
          <option value="Regulation Status">Regulation Status</option>
          <option value="Top AI Tools Used">Top AI Tools Used</option>
        </select>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default BarGraph;
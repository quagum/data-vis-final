import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import './MetricHoverChart.css';

const metrics=[
  'AI Adoption Rate (%)',
  'AI-Generated Content Volume (TBs per year)',
  'Job Loss Due to AI (%)',
  'Revenue Increase Due to AI (%)',
  'Human-AI Collaboration Rate (%)',
  'Consumer Trust in AI (%)',
  'Market Share of AI Companies (%)',
];

function MetricHoverChart({ data }) {
  const [hoveredMetric, setHoveredMetric]=useState(null);
  const [mousePos, setMousePos]=useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible]=useState(false);
  const [renderChart, setRenderChart]=useState(false);
  const [tooltipPos, setTooltipPos]=useState({ left: 0, top: 0 });
  const svgRef=useRef();
  const tooltipRef=useRef();

  useEffect(() => {
    if (tooltipVisible&&hoveredMetric) {
      const timeout=setTimeout(() => setRenderChart(true), 50);
      return () => clearTimeout(timeout);//set a wait time to avoid any glitches
    } else {
      setRenderChart(false);
    }
  }, [tooltipVisible, hoveredMetric]);

  useLayoutEffect(() => {//checks the size of the pop-up window and adjusts it to stay inside page
    if (tooltipRef.current&&renderChart) {
      const rect=tooltipRef.current.getBoundingClientRect();
      const buffer=10;
      const left=Math.min(mousePos.x + 20, window.innerWidth-rect.width-buffer);
      const top=Math.min(Math.max(20, mousePos.y-100), window.innerHeight-rect.height-buffer);
      setTooltipPos({ left, top });
    }
  }, [renderChart, mousePos]);

  useEffect(() => {//transforms data to use to build bar charts
    if (!data||!hoveredMetric||!tooltipRef.current||!renderChart) return;

    const aggregated=d3.rollups(
      data.filter(d => d[hoveredMetric]&&!isNaN(+d[hoveredMetric])),
      v => d3.sum(v, d => +d[hoveredMetric]),
      d => d.Country
    ).sort((a, b) => b[1]-a[1]);

    const width=350;
    const height=250;
    const margin={ top: 20, right: 10, bottom: 60, left: 40 };

    d3.select(svgRef.current).selectAll('*').remove();
    const svg=d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x=d3.scaleBand()
      .domain(aggregated.map(d => d[0]))
      .range([0, width-margin.left-margin.right])
      .padding(0.2);

    const y=d3.scaleLinear()
      .domain([0, d3.max(aggregated, d => d[1])])
      .nice()
      .range([height-margin.top-margin.bottom, 0]);

    const color=d3.scaleOrdinal(d3.schemeCategory10);

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('font-size', '10px');

    svg.append('g')
      .attr('transform', `translate(0,${height-margin.top-margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')
      .attr('dy', '0.5em')
      .attr('dx', '-0.5em');

    svg.selectAll('.bar')
      .data(aggregated)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d[0]))
      .attr('y', d => y(d[1]))
      .attr('width', x.bandwidth())
      .attr('height', d => y(0)-y(d[1]))
      .attr('fill', d => color(d[0]));

    //color-coded bar chart with legend
    const legend=d3.select(tooltipRef.current.querySelector('.legend'));
    legend.selectAll('*').remove();
    aggregated.forEach(([country], i) => {
      const item=document.createElement('div');
      item.className='legend-item';
      item.innerHTML=`<span class="legend-color" style="background-color:${color(country)}"></span>${country}`;
      legend.node().appendChild(item);
    });
  }, [hoveredMetric, data, renderChart]);

  return (
    <div className="metric-hover-chart">
      <div className="metric-boxes">
        {metrics.map(metric => (//creates the hoverable boxes for each decimal metric
          <div
            key={metric}
            className="metric-box"
            onMouseEnter={e => {
              setHoveredMetric(metric);
              setMousePos({ x: e.clientX, y: e.clientY });
              setTooltipVisible(true);
            }}
            onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setTooltipVisible(false);
              setHoveredMetric(null);
            }}
          >
            {metric}
          </div>
        ))}
      </div>
      {hoveredMetric&&tooltipVisible&&(//triggers the tooltip to appear when hoveirng over a box
        <div
          className="chart-tooltip"
          ref={tooltipRef}
          style={{
            position: 'fixed',
            left: tooltipPos.left,
            top: tooltipPos.top
          }}
        >
          <h4>{hoveredMetric}</h4>
          <div className="chart-container centered">
            <svg ref={svgRef}></svg>
            <div className="legend"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetricHoverChart;

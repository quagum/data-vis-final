import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './LineGraph.css';

function LineGraph({ data }) {
    const svgRef = useRef();
    const [selectedMetric, setSelectedMetric] = useState('AI Adoption Rate (%)');
    const [selectedCountry, setSelectedCountry] = useState('All');
    const [maxYear, setMaxYear] = useState(2025);
    const [topTools, setTopTools] = useState([]);
    const [RegStatus, setRegStatus] = useState([]);

    // Metrics available for Y-axis
    const metrics = [
        'AI Adoption Rate (%)',
        'AI-Generated Content Volume (TBs per year)',
        'Job Loss Due to AI (%)',
        'Revenue Increase Due to AI (%)',
        'Human-AI Collaboration Rate (%)',
        'Consumer Trust in AI (%)',
        'Market Share of AI Companies (%)',
    ];

    // Unique countries and industries
    const countries = data ? ['All', ...new Set(data.map(d => d.Country))] : [];
    const industries = data ? [...new Set(data.map(d => d.Industry))] : [];
    const statuses = data ? [...new Set(data.map(d => d["Regulation Status"]))] : [];

    console.log("Statuses: ");
    console.log(statuses)

    useEffect(() => {
        if (!data || !industries.length) return;

        // Filter data by selected country
        const filteredData = selectedCountry === 'All'
            ? data
            : data.filter(d => d.Country === selectedCountry);

        // Get min and max years
        const years = [...new Set(filteredData.map(d => +d.Year))];
        const minYear = Math.min(...years); // Fixed at 2020
        const maxYearPossible = Math.max(...years); // 2025

        // Filter data by year range (minYear to maxYear)
        const plotData = filteredData.filter(d => +d.Year <= maxYear);

        // Group data by industry for lines, aggregating duplicate years
        const dataByIndustry = industries.map(industry => {
            // Filter valid data for the industry
            const industryData = plotData
                .filter(d => d.Industry === industry && !isNaN(+d[selectedMetric]) && d[selectedMetric] !== '')
                .map(d => ({
                    year: +d.Year,
                    value: +d[selectedMetric],
                }));

            // Aggregate duplicate years by averaging values
            const yearMap = new Map();
            industryData.forEach(d => {
                if (yearMap.has(d.year)) {
                    const existing = yearMap.get(d.year);
                    yearMap.set(d.year, {
                        year: d.year,
                        value: (existing.value * existing.count + d.value) / (existing.count + 1),
                        count: existing.count + 1,
                    });
                } else {
                    yearMap.set(d.year, { year: d.year, value: d.value, count: 1 });
                }
            });

            const values = Array.from(yearMap.values())
                .map(d => ({ year: d.year, value: d.value }))
                .sort((a, b) => a.year - b.year);


            const aiToolsCount = new Map();

            // Collect and count tools across filtered data
            plotData.forEach(d => {
                if (d['Top AI Tools Used']) {
                    const tools = d['Top AI Tools Used']
                        .split(',')
                        .map(tool => tool.trim())
                        .filter(tool => tool); // remove empty

                    tools.forEach(tool => {
                        aiToolsCount.set(tool, (aiToolsCount.get(tool) || 0) + 1);
                    });
                }
            });

            // Convert Map to sorted array
            const sortedTools = Array.from(aiToolsCount.entries())
                .sort((a, b) => b[1] - a[1]); // Descending by frequency

            setTopTools(sortedTools);

            const RegStatus = new Map();

            plotData.forEach(d => {
                if (d['Regulation Status']) {
                    const tools = d['Regulation Status']
                        .split(',')
                        .map(tool => tool.trim())
                        .filter(tool => tool);
                    tools.forEach(tool => {
                        RegStatus.set(tool, (RegStatus.get(tool) || 0) + 1)
                    })
                }
            })

            const sortedStatus = Array.from(RegStatus.entries())
                .sort((a, b) => b[1] - a[1]);

            setRegStatus(sortedStatus);

            return { industry, values };
        });


        // Set up SVG dimensions
        const margin = { top: 20, right: 100, bottom: 100, left: 60 };
        const width = 1800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll('*').remove();

        // Create SVG
        const svg = d3
            .select(svgRef.current)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Define clip path to prevent lines from extending outside the graph area
        svg
            .append('defs')
            .append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width / 3 + 100)
            .attr('height', height);

        const plotArea = svg.append('g').attr('clip-path', 'url(#clip)');

        // Scales
        const xScale = d3
            .scaleLinear()
            .domain([minYear, maxYear])
            .range([0, width / 3 + 100]);

        // Calculate Y-scale after dataByIndustry is defined
        const maxYValue = d3.max(dataByIndustry, d => d3.max(d.values, v => v.value)) || 100;
        const yScale = d3
            .scaleLinear()
            .domain([0, maxYValue * 1.1]) // Add 10% padding
            .range([height, 0]);

        // Color scale for industries
        const colorScale = d3
            .scaleOrdinal()
            .domain(industries)
            .range(d3.schemeCategory10);

        // Line generator
        const line = d3
            .line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX)
            .defined(d => !isNaN(d.value));

        plotArea
            .selectAll('.line')
            .data(dataByIndustry)
            .enter()
            .append('path')
            .attr('class', 'line')
            .attr('d', d => line(d.values))
            .attr('fill', 'none')
            .attr('stroke', d => colorScale(d.industry))
            .attr('stroke-width', 4);

        // X-axis
        svg
            .append('g')
            .attr('transform', `translate(0,${height})`)
            .call(
                d3.axisBottom(xScale)
                    .tickValues(d3.range(minYear, maxYear + 1, 1)) // Explicit years from minYear to maxYear
                    .tickFormat(d3.format('d'))
            )
            .append('text')
            .attr('x', width / 6 + 50)
            .attr('y', 40)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text('Year');


        // Y-axis
        svg
            .append('g')
            .call(d3.axisLeft(yScale))
            .append('text')
            .attr('x', -height / 2)
            .attr('y', -40)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .text(selectedMetric);


        //Bar Chart axes
        var barx = d3.scaleBand().range([width / 3 + 350, width - 50]).domain(statuses).padding(0.3);
        const xAxis = svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(barx));

        //Styling Labels for Axis
        xAxis.selectAll("text").attr("transform", "rotate(0)").style("text-anchor", "middle");

        //Title for Axis
        xAxis.append("text")
            .attr("x", 2 * width / 3 + 150)  // center of the x-axis range
            .attr("y", 40)  // below the axis line
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .text("Status");

        var scaling = 100;
        const bary = d3.scaleLinear().domain([0, scaling]).range([height, 0]);
        const yAxis = svg.append('g').attr('transform', `translate(${width / 2 + 77}, 0)`).call(d3.axisLeft(bary));  // Shift to where bars begin

        yAxis.append('text')
            .attr('x', -height / 2)
            .attr('y', -40)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .text("Count");

        const colorMap = {
            "Lenient": "green",
            "Moderate": "yellow",
            "Strict": "red"
        };

        svg.selectAll(".bar")
            .data(RegStatus)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => barx(d[0]))
            .attr("y", d => bary(d[1]))
            .attr("width", barx.bandwidth())
            .attr("height", d => height - bary(d[1]))
            .attr("fill", d => colorMap[d[0]]);


        // Legend
        const legend = svg
            .append('g')
            .attr('transform', `translate(${width / 3 + 120}, 0)`);

        legend
            .selectAll('.legend-item')
            .data(industries)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .each(function (d) {
                d3.select(this)
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', 10)
                    .attr('height', 10)
                    .attr('fill', colorScale(d));

                d3.select(this)
                    .append('text')
                    .attr('x', 15)
                    .attr('y', 10)
                    .text(d);
            });
    }, [data, selectedMetric, selectedCountry, maxYear]);

    return (
        <div className="line-graph">
            <h2>AI Impact by Industry</h2>
            <svg ref={svgRef}></svg>
            <div className="controls">
                <div className="metric-selector">
                    <h3>Select Metric</h3>
                    {metrics.map(metric => (
                        <label key={metric}>
                            <input
                                type="radio"
                                name="metric"
                                value={metric}
                                checked={selectedMetric === metric}
                                onChange={() => setSelectedMetric(metric)}
                            />
                            {metric}
                        </label>
                    ))}
                </div>
                <div className="country-selector">
                    <h3>Select Country</h3>
                    <select
                        value={selectedCountry}
                        onChange={e => setSelectedCountry(e.target.value)}
                    >
                        {countries.map(country => (
                            <option key={country} value={country}>
                                {country}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="year-slider">
                    <h3>Max Year: {maxYear}</h3>
                    <input
                        type="range"
                        min={2020}
                        max={2025}
                        value={maxYear}
                        onChange={e => setMaxYear(+e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

export default LineGraph;
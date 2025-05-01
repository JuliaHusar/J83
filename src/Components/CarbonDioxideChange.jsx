import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { getReport } from "../BackendRequests";
import {schemeTableau10} from 'd3-scale-chromatic';

const CarbonDioxideChange = () => {
    const [data, setData] = useState([]);
    const graphRef = useRef();
    const yAxisRef = useRef();
    const tableauColors = schemeTableau10;

    useEffect(() => {
        getReport().then(response => {
            if (response.status === 200) {
                setData(response.data);
            } else {
                console.error('Error fetching data:', response.statusText);
            }
        }).catch(error => {
            console.error('Error fetching data:', error);
        });
    }, []);

    useEffect(() => {
        d3.select(graphRef.current).selectAll("*").remove();
        d3.select(yAxisRef.current).selectAll("*").remove();
        if (data.length === 0) return;
        const margin = { top: 50, right: 70, bottom: 50, left: 70 };
        const width = 4000 - margin.left - margin.right;
        const height = 1200 - margin.top - margin.bottom;

        const svg = d3.select(graphRef.current)
            .attr('width', width)
            .attr('height', height + margin.top + margin.bottom);

        const group = svg.append("g")
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const co2InValues = data.co2_in.map(d => d.Co2_In);
        const co2OutValues = data.co2_out.map(d => d.Co2_Out);
        const timeStrings = data.co2_in.map(d => d.LocalTime);
        const parseTime = d3.timeParse("%m/%d/%Y %I:%M:%S\u202f%p");
        const time = timeStrings.map(ts => parseTime(ts));

        const x = d3.scaleTime()
            .domain(d3.extent(time))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([300, 1000])
            .range([height, 0]);

        const co2InLine = d3.line()
            .x((d, i) => x(time[i]))
            .y(d => y(d))
            .curve(d3.curveMonotoneX);
        const co2OutLine = d3.line()
            .x((d, i) => x(time[i]))
            .y(d => y(d))
            .curve(d3.curveMonotoneX);

        group.append("path")
            .datum(co2InValues)
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", 3)
            .attr("d", co2InLine);

        group.append("path")
            .datum(co2OutValues)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 3)
            .attr("d", co2OutLine);

        group.selectAll(".co2-in-point")
            .data(co2InValues)
            .enter()
            .append("circle")
            .attr("class", "co2-in-point")
            .attr("cx", (d, i) => x(time[i]))
            .attr("cy", d => y(d))
            .attr("r", 4)
            .attr("fill", tableauColors[4]);

        group.selectAll(".co2-out-point")
            .data(co2OutValues)
            .enter()
            .append("circle")
            .attr("class", "co2-out-point")
            .attr("cx", (d, i) => x(time[i]))
            .attr("cy", d => y(d))
            .attr("r", 4)
            .attr("fill", tableauColors[8]);

        const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.timeFormat("%m/%d/%Y %I:%M:%S\u202f%p"));
        const yAxis = d3.axisLeft(y);

        group.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        const yAxisSvg = d3.select(yAxisRef.current)
            .attr('width', margin.left)
            .attr('height', height);

        yAxisSvg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(yAxis);

    }, [data]);

    return (
        <div className="flex flex-col items-center justify-center w-full p-10">
            <h1 className="text-3xl font-bold mb-4">Carbon Dioxide Change</h1>
            <div className="relative flex w-full border-2 border-gray-300 rounded-lg overflow-hidden">
                <svg
                    ref={yAxisRef}
                    className="absolute left-0 top-0 h-full"
                    style={{ width: 70, background: "#fff", zIndex: 10 }}
                />
                {/* Scrollable graph */}
                <div style={{ overflowX: "auto", width: "100%" }}>
                    <svg
                        ref={graphRef}
                        width={4000}
                        height={1200}
                        style={{ marginLeft: 70 }} // Add margin to account for fixed y-axis width
                    />
                </div>
            </div>
        </div>
    );
};

export default CarbonDioxideChange;
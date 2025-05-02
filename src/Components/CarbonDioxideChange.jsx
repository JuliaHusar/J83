import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { getReport } from "../HelperFunctions/BackendRequests";
import {schemeTableau10} from 'd3-scale-chromatic';
import COin from '../Assets/CarbonDioxide.png';

const CarbonDioxideChange = () => {
    const [data, setData] = useState([]);
    const graphRef = useRef();
    const yAxisRef = useRef();
    const [loading, setLoading] = useState(true);
    const tableauColors = schemeTableau10;

    useEffect(() => {
        setLoading(true);
        getReport().then(response => {
            if (response.status === 200) {
                setData(response.data);
            } else {
                console.error('Error fetching data:', response.statusText);
            }
            setLoading(false);
        }).catch(error => {
            console.error('Error fetching data:', error);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        d3.select(graphRef.current).selectAll("*").remove();
        d3.select(yAxisRef.current).selectAll("*").remove();
        if (data.length === 0) return;
        const margin = { top: 50, right: 70, bottom: 50, left: 70 };
        const width = 10000 - margin.left - margin.right;
        const height = 1200 - margin.top - margin.bottom;

        const svg = d3.select(graphRef.current)
            .attr('width', width)
            .attr('height', height + margin.top + margin.bottom);

        const group = svg.append("g")
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
        const downsample = (arr, step) => arr.filter((_, i) => i % step === 0);

        const co2InValues = downsample(data.co2_in.map(d => d.Co2_In), 10);
        const co2OutValues = downsample(data.co2_out.map(d => d.Co2_Out), 10);
        const timeStrings = downsample(data.co2_in.map(d => d.LocalTime), 10);
        const parseTime = d3.timeParse("%m/%d/%Y %I:%M:%S\u202f%p");
        const time = timeStrings.map(ts => parseTime(ts));

        const tooltip = d3.select("#co2-tooltip");

        const x = d3.scaleTime()
            .domain(d3.extent(time))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([300, 1000])
            .range([height, 0]);

        const co2InLine = d3.line()
            .x((d, i) => x(time[i]))
            .y(d => y(d))
        const co2OutLine = d3.line()
            .x((d, i) => x(time[i]))
            .y(d => y(d))

        group.append("path")
            .datum(co2InValues)
            .attr("fill", "none")
            .attr("stroke", "#c54663")
            .attr("stroke-width", 1.5)
            .attr("d", co2InLine);

        group.append("path")
            .datum(co2OutValues)
            .attr("fill", "none")
            .attr("stroke", "#4caa69")
            .attr("stroke-width", 1.5)
            .attr("d", co2OutLine);

        group.selectAll(".co2-in-point")
            .data(co2InValues)
            .enter()
            .append("circle")
            .attr("class", "co2-in-point")
            .attr("cx", (d, i) => x(time[i]))
            .attr("cy", d => y(d))
            .attr("r", 2)
            .attr("fill", '#d81d48')
            .on("mouseover", function(event, d) {
                tooltip
                    .style("opacity", 1)
                    .html(`CO₂ In: ${d}<br/>Time: ${d3.timeFormat("%m/%d/%Y %I:%M:%S %p")(time[co2InValues.indexOf(d)])}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
            });

        group.selectAll(".co2-out-point")
            .data(co2OutValues)
            .enter()
            .append("circle")
            .attr("class", "co2-out-point")
            .attr("cx", (d, i) => x(time[i]))
            .attr("cy", d => y(d))
            .attr("r", 2)
            .attr("fill", '#095513')
            .on("mouseover", function(event, d) {
                tooltip
                    .style("opacity", 1)
                    .html(`CO₂ Out: ${d}<br/>Time: ${d3.timeFormat("%m/%d/%Y %I:%M:%S %p")(time[co2OutValues.indexOf(d)])}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
            });

        const xAxis = d3.axisBottom(x).ticks(50).tickFormat(d3.timeFormat("%m/%d/%Y %I:%M:%S\u202f%p"));
        const yAxis = d3.axisLeft(y);

        group.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        const yAxisSvg = d3.select(yAxisRef.current)
            .attr('width', margin.left)
            .attr('height', height);

        yAxisSvg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 20)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("CO2 Concentration (ppm)");

        yAxisSvg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(yAxis);

        group.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .style("text-anchor", "middle")
            .text("Time (Local)");

        const legendSVG = d3.select(graphRef.current)
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(16, ${margin.top})`);
        legendSVG.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#c54663");
        legendSVG.append("text")
            .attr("x", 25)
            .attr("y", 15)
            .text("CO₂ In")
            .attr("font-size", "12px")
            .attr("fill", "#c54663");
        legendSVG.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#4caa69");
        legendSVG.append("text")
            .attr("x", 25)
            .attr("y", 45)
            .text("CO₂ Out")
            .attr("font-size", "12px")
            .attr("fill", "#4caa69");

        const circleSVGLegend = d3.select(graphRef.current)

    }, [data]);

    return (
        <div className="flex flex-col items-center justify-center w-full p-10">
            <h1 className="text-3xl font-bold mb-4">Carbon Dioxide Change Over April 2025</h1>
            {loading ? (
                <div className="flex items-center justify-center">
                    <p className="text-xl">Loading...</p>
                </div>
            ) : (
                <div className="relative flex w-full border-2 border-gray-300 rounded-lg overflow-hidden">
                    <svg
                        ref={yAxisRef}
                        className="absolute left-0 top-0 h-full"
                        style={{ width: 70, background: "#fff", zIndex: 10 }}
                    />
                    <div style={{overflowX: "auto", width: "100%"}}>
                        <svg
                            ref={graphRef}
                            width={4000}
                            height={1200}
                            style={{marginLeft: 70}}
                        />
                        <div
                            id="co2-tooltip"
                            style={{
                                position: "absolute",
                                opacity: 0,
                                pointerEvents: "none",
                                background: "#fff",
                                border: "1px solid #ccc",
                                padding: "8px",
                                borderRadius: "4px",
                                zIndex: 100
                            }}
                        ></div>
                    </div>
                </div>
            )}
            <div className="flex justify-center items-center font-bold mt-4 mb-5">
                <h2>Graph Explanation</h2>
            </div>
            <div className='flex flex-row space-x-5'>
                <div className="relative w-1/2 border-2 border-gray-300 rounded-lg overflow-hidden p-5">
                    <p>This data represents air that was filtered by microalgae enclosures inside of the innovation barn
                        in Charlotte. This air goes through a vent at the top of the system, where Microalgae use the
                        Co2 and incoming sunlight as nutrients for photosynthesis. The cleaned air is outputted through
                        a tube on the side of the enclosure. I programmed two Co2 Sensors using ESP32 microcontrollers,
                        to gather realtime data about the air quality every single minute, and then send that data to a
                        google sheets client. This data was downloaded from google sheets, cleaned in Tableau Prep for
                        uniformity, and then inserted into a SQL database which is hosted on Digital Ocean. The data
                        from both sensors is displayed here with the red data representing Co2 Input, and the green data
                        representing Co2 Output. The line chart shows an overall reduction in Co2 which displays the function of
                        this system.</p>
                </div>
                <div className="relative w-1/2 border-2 border-gray-300 rounded-lg overflow-hidden p-5">
                   <img src={COin} alt='Co2 In' className='w-full h-auto'/>
                </div>
            </div>

            </div>
    );
};

export default CarbonDioxideChange;
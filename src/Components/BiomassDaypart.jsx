import * as d3 from 'd3';
import {useEffect, useRef, useState} from "react";
import {convertToDate, getReport, getSummary} from "../HelperFunctions/BackendRequests";
import {dataToDayparts, hourlyDataForDay} from "../HelperFunctions/HelperFunctions";
import Lightin from "../Assets/Lightin.png";

const BiomassDaypart = () => {
    const [selectedData, setSelectedData] = useState(null);
    const [biomassData, setBiomassData] = useState([]);
    const [co2InData, setCo2InData] = useState([]);
    const [co2OutData, setCo2OutData] = useState([]);
    const [luxInData, setLuxInData] = useState([]);
    const [loading, setLoading] = useState(true);
    const width = 4000;
    const height = 700;
    const margin = {top: 20, right: 80, bottom: 20, left: 60};
    const ref = useRef();
    const legendRef = useRef();
    const circleRef = useRef();

    useEffect(() => {
        async function fetchData() {
            const summaryResponse = await getSummary();
            const reportResponse = await getReport();
            if (summaryResponse.status === 200 && reportResponse.status === 200) {
                setBiomassData(summaryResponse.data.biomass_data || []);
                setCo2InData(reportResponse.data.co2_in);
                setCo2OutData(reportResponse.data.co2_out);
                setLuxInData(reportResponse.data.lux_in);
                setLoading(false);
            } else {
                console.error('Error fetching data:', summaryResponse.statusText, reportResponse.statusText);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (biomassData.length === 0) return;
        const parseDate = d3.timeParse("%Y-%m-%d");
        let averagedDataMap = {};
        console.log(biomassData);
        biomassData.forEach(d => {
            let averagedData = hourlyDataForDay(co2InData, co2OutData, luxInData, d.date);
            averagedDataMap[d.date] = averagedData;
        })

        const dataWithQuads = biomassData.map(d => {
            const averages = averagedDataMap[d.date] || {};
            const hours = Array.from({length: 24}, (_, h) => h);
            const luxInHourly = hours.map(h => averages.averageLuxInValues?.[h] ?? 0);
            return {
                ...d,
                date: parseDate(d.date),
                biomass: +d.biomass_g_l,
                luxInHourly,
            };
        });

        const svg = d3.select(ref.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll("*").remove();
        const tooltip = d3.select('#tooltip');

        const x = d3.scaleTime()
            .domain(d3.extent(dataWithQuads, d => d.date))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([2.8, d3.max(dataWithQuads, d => d.biomass)]).nice()
            .range([height - margin.bottom, margin.top]);

        const biomassRadius = d3.scaleSqrt()
            .domain([d3.min(dataWithQuads, d => d.biomass), d3.max(dataWithQuads, d => d.biomass)])
            .range([5, 50]);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(d => biomassRadius(d.parentBiomass));

        const pie = d3.pie()
            .sort(null)
            .value(d => d);

        const circlesGroup = svg.selectAll(".biomass-circle")
            .data(dataWithQuads)
            .enter()
            .append("g")
            .attr("class", "biomass-circle")
            .attr("transform", d => `translate(${x(d.date)},${y(d.biomass)})`)
            .on('mouseover', (event, d) => {
                tooltip
                    .style('opacity', 1)
                    .html(
                        `Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>
                            Biomass: ${d.biomass?.toFixed(2) ?? '-'} g/L<br>
                         `
                    )
                    .style('left', `${event.pageX + 5}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', () => {
                tooltip.style('opacity', 0);
            })
            .on('click', (event, d) => {
                setSelectedData(d);
            });

        circlesGroup.selectAll(".arc")
            .data(d => {
                const luxMin = d3.min(d.luxInHourly);
                const luxMax = d3.max(d.luxInHourly);
                const color = d3.scaleSequential()
                    .domain([luxMin, luxMax * 1.5])
                    .interpolator(d3.interpolateBlues);
                return pie(d.luxInHourly).map(seg => ({
                    ...seg,
                    parentBiomass: d.biomass,
                    luxValue: seg.value,
                    color: color(seg.value)
                }));
            })
            .enter()
            .append("path")
            .attr("class", "arc")
            .attr("d", arc)
            .attr("fill", d => d.color);

        circlesGroup.append("circle")
            .attr("r", d => biomassRadius(d.biomass))
            .attr("fill", "none")
            .attr("stroke", "#333")
            .attr("stroke-width", 1);

        circlesGroup.append("text")
            .attr("x", 0)
            .attr("y", d => biomassRadius(d.biomass) + 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#333")
            .text(d => d3.timeFormat("%Y-%m-%d")(d.date))

        circlesGroup.append("text")
            .attr("x", 0)
            .attr("y", d => biomassRadius(d.biomass) + 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#333")
            .text(d => d3.format(".2f")(d.biomass) + " g/L");

        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        svg.append('g')
            .attr('transform', `translate(${margin.left - 20},0)`)
            .call(d3.axisLeft(y));

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - margin.bottom + 45)
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', 'black')
            .text('Date');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', 0 - (height / 2))
            .attr('y', margin.left - 45)
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', 'black')
            .text('Biomass (g/L)');

        const legendSVG = d3.select(legendRef.current)
            .attr('width', 200)
            .attr('height', 80)
            .style('margin-left', '20px');

        legendSVG.selectAll("*").remove();

        const minLux = d3.min(dataWithQuads, d => d3.min(d.luxInHourly));
        const maxLux = d3.max(dataWithQuads, d => d3.max(d.luxInHourly));

        const colorScale = d3.scaleSequential()
            .domain([minLux, maxLux])
            .interpolator(d3.interpolateBlues);
        const legendData = d3.range(minLux, maxLux, (maxLux - minLux) / 10);
        const legendOffsetY = 30;
        const legendMainGroup = legendSVG.append("g")
            .attr("transform", `translate(0,${legendOffsetY})`);
        const legendGroup = legendMainGroup.selectAll(".legend")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${i * 20},0)`);

        legendGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => colorScale(d));

        legendGroup.append("text")
            .attr("x", 10)
            .attr("y", 35)
            .attr("text-anchor", "middle")
            .text(d => d3.format(".0f")(d))
            .style("font-size", "6")
            .style("fill", "black");

        legendSVG.append("text")
            .attr("x", 10)
            .attr("y", 10)
            .text("Lux In")
            .style("font-size", "14px")
            .style("fill", "black");

        const circleLegendSVG = d3.select(circleRef.current)
            .attr('width', 400)
            .attr('height', 200)
            .style('margin-left', '20px');
        circleLegendSVG.selectAll("*").remove();

        const circleLegendData = [
            { label: "Low Biomass", radius: biomassRadius(d3.min(dataWithQuads, d => d.biomass)) },
            { label: "Medium Biomass", radius: biomassRadius((d3.min(dataWithQuads, d => d.biomass) + d3.max(dataWithQuads, d => d.biomass)) / 2.1) },
            { label: "High Biomass",  radius: biomassRadius((d3.min(dataWithQuads, d => d.biomass) + d3.max(dataWithQuads, d => d.biomass)) / 2) },
        ];
        const circleLegendGroup = circleLegendSVG.selectAll(".circle-legend")
            .data(circleLegendData)
            .enter()
            .append("g")
            .attr("class", "circle-legend")
            .attr("transform", (d, i) => `translate(${i * 100},50)`);

        circleLegendGroup.append("circle")
            .attr("cx", 10)
            .attr("cy", 0)
            .attr("r", d => d.radius)
            .attr("fill", "none")
            .attr("stroke", "#333")
            .attr("stroke-width", 1);

        circleLegendGroup.append("text")
            .attr("x", 10)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .text(d => d.label)
            .style("font-size", "8px")
            .style("fill", "#333");

    }, [biomassData, selectedData]);

    return loading ? (
        <div className="flex items-center justify-center">
            <p className="text-xl">Loading...</p>
        </div>
    ) : (
        <div className="biomass-daypart m-5 flex flex-col">
            <div className='flex flex-col justify-center items-center font-bold'>
                <h2>Biomass and Light Fluctuations over Time</h2>
                <h2>Scroll Horizontally for All Data</h2>

            </div>
            <div className='mt-4 flex flex-row' style={{position: "sticky", left: 0, zIndex: 2, background: "#fff"}}>
                <svg ref={legendRef} id="biomass-legend"/>
                <svg ref={circleRef} id="biomass-circle-legend"/>
            </div>
            <div className="m-5 flex" style={{position: "relative"}}>
                <div style={{overflowX: "auto", width: "100%"}}>
                    <svg ref={ref} id="biomass-chart"/>
                    <div id="tooltip"
                         style={{
                             position: 'absolute',
                             opacity: 0,
                             background: '#fff',
                             border: '1px solid #ccc',
                             padding: '10px'
                         }}></div>
                </div>
            </div>
            <div className="flex justify-center items-center font-bold mt-4 mb-5">
                <h2>Graph Explanation</h2>
            </div>
            <div className='flex flex-row space-x-5'>
                <div className="relative w-1/2 border-2 border-gray-300 rounded-lg overflow-hidden p-5">
                    <p>This data represents biomass that was harvested from one of the micro algae panels within the innovation barn as well as the light input that the micro algae received. The data for the biomass was collected every day over the course of a month and a half from the micro algae system itself. This data was then measured for OD 600 (cell count) and the final value was put into an Excel file. From this Excel file, I downloaded the data and standardized it into a SQL DB. Combined with this, lux sensors took light data every single minute so that we could correlate micro algae growth with light inputs. Light data was pushed to a google sheets file which was then downloaded and standardized into a SQL DB. This graph then uses a multivarible approach to display different variables on a 2 dimensional plane. The radius of the circle is determined by the amount of biomass relative to all of the data collected, while every single lux data point is mapped within a color range. These color ranges are spread out across 24 hours within a circle, with darker colors corresponding to higher counts of Lux In, meaning that there are higher amounts of solar intensity at these times.</p>
                </div>
                <div className="relative w-1/2 border-2 border-gray-300 rounded-lg overflow-hidden p-5">
                    <img className='object-cover' src={Lightin} alt='Light In' style={{width: '1000px', height: '1000px'}}/>
                </div>
            </div>
        </div>
    );
}
export default BiomassDaypart;
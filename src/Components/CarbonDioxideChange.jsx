import * as d3 from 'd3';
import {useEffect, useRef, useState} from 'react';
import {getReport} from "../BackendRequests";

const CarbonDioxideChange = () => {
    const [data, setData] = useState([]);
    const graphRef = useRef();
    useEffect(() => {
        getReport().then(response => {
            setData(response.data);
        })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }, []);

    useEffect(() => {
        d3.select(graphRef.current).selectAll("*").remove();
        if (data.length === 0) return;
        console.log(data);
        const margin = {top: 20, right: 30, bottom: 40, left: 40};
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        const co2In = data.map(d => d.co2_in);
        const co2Out = data.map(d => d.co2_out);
        const time = data.map(d => d.LocalTime);
        const svg = d3.select(graphRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

    }, [data]);


    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold mb-4">Carbon Dioxide Change</h1>

        </div>
    );
}
export default CarbonDioxideChange;
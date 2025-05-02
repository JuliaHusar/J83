import * as d3 from 'd3';

export const hourlyDataForDay = (co2In, co2Out, luxIn, selectedDate) => {
    const transformedSelectedDate =formatDateToMDY(selectedDate);
    const parseTime = d3.timeParse("%m/%d/%Y %I:%M:%S %p");
    console.log(transformedSelectedDate);
    const groupByHour = (data, valueKey, takeFirst = false) => {
        const byHour = {};
        data.filter(d => d.LocalTime.startsWith(transformedSelectedDate)).forEach(d => {
            const cleaned = cleanLocalTime(d.LocalTime);
            const dateObj = parseTime(cleaned);
            if (dateObj) {
                const hour = dateObj.getHours();
                if (!byHour[hour]) byHour[hour] = [];
                byHour[hour].push(+d[valueKey]);
            }
        });
        const result = {};
        Object.keys(byHour).forEach(hour => {
            result[hour] = takeFirst ? byHour[hour][0] : d3.mean(byHour[hour]);
        });
        return result;
    };

    return {
        averageCo2InValues: groupByHour(co2In, 'Co2_In'),
        averageCo2OutValues: groupByHour(co2Out, 'Co2_Out'),
        averageLuxInValues: groupByHour(luxIn, 'front_lux_values', true),
    };
};

export function averageDayParts(averageCo2InValues, averageCo2OutValues, averageLuxInValues){

}

export function cleanLocalTime(str) {
    return str.replace(/\s+/g, ' ').replace(/\u202F/g, ' ');
}
export function formatDateToMDY(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
}
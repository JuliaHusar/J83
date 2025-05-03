import axios from "axios";

export const backendRequests = async (token) => {
    return axios.post(
        "/api/validate",
        {},
        {
            headers: {
                Authorization: token,
            },
        }
    );
};

export async function getReport(){
    return axios.get(
        "/api/report",
        {
        },
    )
}

export async function getSummary(){
    return axios.get(
        "/api/summary",
        {
        },
    )
}

export async function convertToDate(dateString) {
    const dateObject = new Date(dateString);
    return dateObject.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
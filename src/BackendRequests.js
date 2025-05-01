import axios from "axios";

export const backendRequests = async (token) => {
    return axios.post(
        "http://127.0.0.1:5000/api/validate",
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
        "http://127.0.0.1:5000/api/report",
        {
        },
    )
}
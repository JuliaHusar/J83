import axios from "axios";

export const validateToken = async (token) => {
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
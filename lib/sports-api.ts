import { useQuery } from "@tanstack/react-query";

const BASE_URL = 'https://api.balldontlie.io/nfl/v1';

const getBallDontLieData = async (endpoint: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch Ball Dont Lie data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data)
    return data;
};

export const useBallDontLieData = (endpoint: string) => {
    return useQuery({
        queryKey: ['ballDontLieData', endpoint],
        queryFn: () => getBallDontLieData(endpoint),
    });
};
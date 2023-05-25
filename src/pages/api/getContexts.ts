import axios, { AxiosResponse } from 'axios'

export const config = {
  runtime: 'edge',
}
export interface getTopContextsResponse {
  id: number
  text: string
  readable_filename: string
  course_name: string
  s3_path: string
  pagenumber_or_timestamp: string
}


export const fetchContexts = async (course_name : string, search_query: string) => {
  // axios.defaults.baseURL = 'https://flask-production-751b.up.railway.app'; TODO: could use multiple axios instances for each api service
  try {
    const response: AxiosResponse<getTopContextsResponse[]> = await axios.get('https://flask-production-751b.up.railway.app/getTopContexts', {
      params: {
        course_name: course_name,
        search_query: search_query,
        top_n: 5, // todo make dynamic if we want.
      },
    });
    // console.log('fetchContexts things', response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};
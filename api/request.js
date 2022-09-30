import axios from 'axios';

const request = axios.create({
    baseURL:process.env.URL_DO_SERVIDOR,
});

request.defaults.headers.post['Content-Type'] = 'application/json'

export default request;
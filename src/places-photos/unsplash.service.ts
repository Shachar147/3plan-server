import {Logger} from '@nestjs/common';
import axios from 'axios';

export class UnsplashService {
    private logger = new Logger('UnsplashService');

    async getPhotosByPlace(place: string): Promise<string[]> {
        const url = `https://unsplash.com/napi/search/photos?orientation=landscape&page=1&per_page=20&query=${encodeURIComponent(place)}&xp=search-disable-synonyms-2%3Acontrol`;

        try {
            const response = await axios.get(url);
            return response.data.results.sort((a,b) => b['likes'] - a['likes']).map(photo => photo.urls['raw']);

        } catch (error) {
            console.error('Error fetching photos:', error.message);
            return [];
        }
    }

// // Example usage:
//     getPhotosByPlace('new york')
// .then(photos => console.log(photos))
// .catch(error => console.error(error));

}

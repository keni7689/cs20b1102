import { error, json } from '@sveltejs/kit';

export const GET = async ({ url }) => {
	const urls = url.searchParams.getAll('url');
	const valid_urls = urls.filter((url) => url.match(/https?:\/\/[^\s]+/));

	if (valid_urls.length === 0) throw error(400, 'No valid URLs provided');

	const fetchWithTimeout = (url: string) => {
		return Promise.race([
			fetch(url)
				.then((response) => response.json())
				.then((data) => {
					// Validate the data structure
					if (data && data.numbers && Array.isArray(data.numbers)) {
						return data;
					}
					throw new Error('Invalid data format');
				}),
			new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 500)),
		]);
	};

	const responses = await Promise.all(urls.map((url) => fetchWithTimeout(url).catch(() => null)));

	// Filter out null values (ignored results)
	const validResponses = responses.filter((response) => response !== null);

	// Combine all the numbers into a single array
	const numbers = validResponses.reduce((acc, response) => [...acc, ...response.numbers], []);
	const uniqueNumbers = [...new Set(numbers)] as number[];
	const sorted = uniqueNumbers.sort((a, b) => a - b);

	return json({ numbers: sorted });
};

export default async function handler(req, res) {
  const { q, maxResults } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=${maxResults || 5}&videoDuration=medium&videoDefinition=high&order=relevance&key=${apiKey}`;
  const ytRes = await fetch(url);
  const data = await ytRes.json();
  res.status(200).json(data);
}
export default async function handler(req, res) {
  const { videoId, maxResults } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults || 20}&key=${apiKey}`;
  const ytRes = await fetch(url);
  const data = await ytRes.json();
  res.status(200).json(data);
}
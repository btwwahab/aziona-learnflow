export default async function handler(req, res) {
  const { ids } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids}&key=${apiKey}`;
  const ytRes = await fetch(url);
  const data = await ytRes.json();
  res.status(200).json(data);
}
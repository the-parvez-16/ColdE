import axios from "axios";

const N8N_BASE_URL = process.env.N8N_BASE_URL; // .env me rakho
payload = {
  "name": "Krish",
  "niche": "Frontend Developer",
  "skills": "React"
}
export async function generateEmail(payload) {
  const url = `${N8N_BASE_URL}/generate-email`;
  const { data } = await axios.post(url, payload);

  // Groq json → email text
  const emailBody = data.choices?.[0]?.message?.content || "";
  return emailBody;
}

export async function classifyReply(replyText) {
  const url = `${N8N_BASE_URL}/classify-reply`;
  const { data } = await axios.post(url, { replyText });

  const label = data.choices?.[0]?.message?.content?.trim().toLowerCase();
  return label;
}
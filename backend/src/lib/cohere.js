import axios from "axios";

const DEFAULT_MODEL = (process.env.COHERE_MODEL || "command-a-03-2025").trim();
const DEFAULT_BASE_URL = "https://api.cohere.ai/v1";
const DEFAULT_TIMEOUT = Number.parseInt(process.env.COHERE_TIMEOUT || "20000", 10);

const buildUrl = (path = "chat") => {
  const base = (process.env.COHERE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  return `${base}/${path}`;
};

export const hasCohereCredentials = () => Boolean(process.env.COHERE_API_KEY);

export const getDefaultCohereModel = () => DEFAULT_MODEL;

const toText = (content) => {
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part) return "";
        if (typeof part === "string") return part;
        if (part?.text) return part.text;
        if (typeof part === "object") return JSON.stringify(part);
        return String(part);
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof content === "string") return content;
  if (!content) return "";
  if (content?.text) return content.text;
  if (typeof content === "object") return JSON.stringify(content);

  return String(content);
};

export const callCohereChat = async ({ messages = [], model = DEFAULT_MODEL, temperature = 0.4, maxTokens = 600, extra = {} }) => {
  if (!hasCohereCredentials()) {
    throw new Error("Missing Cohere credentials: set COHERE_API_KEY in the environment");
  }

  const systemMessages = messages.filter((msg) => msg?.role === "system");
  const conversationMessages = messages.filter((msg) => msg?.role !== "system");

  const preamble = systemMessages.map((msg) => toText(msg.content)).filter(Boolean).join("\n\n");
  const history = conversationMessages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "CHATBOT" : "USER",
    message: toText(msg.content),
  }));

  const latestMessage = conversationMessages[conversationMessages.length - 1];

  const payload = {
    model,
    temperature,
    max_tokens: maxTokens,
    preamble: preamble || undefined,
    chat_history: history.filter((item) => item.message?.trim()),
    message: latestMessage ? toText(latestMessage.content) : "",
    ...extra,
  };

  const { data } = await axios.post(buildUrl("chat"), payload, {
    headers: {
      Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      "Content-Type": "application/json",
      "Cohere-Version": process.env.COHERE_API_VERSION || "2024-10-22",
    },
    timeout: DEFAULT_TIMEOUT,
  });

  return data;
};

export const extractCohereText = (response) => {
  if (!response) return "";

  if (typeof response === "string") {
    return response;
  }

  if (response.text) {
    return response.text;
  }

  if (Array.isArray(response.generations) && response.generations.length > 0) {
    return response.generations.map((generation) => generation.text || "").join("\n").trim();
  }

  if (response.message?.content) {
    return response.message.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.text) return part.text;
        if (Array.isArray(part?.segments)) {
          return part.segments.map((segment) => segment.text || "").join(" ").trim();
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
};

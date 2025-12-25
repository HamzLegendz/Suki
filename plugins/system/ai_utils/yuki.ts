import axios from 'axios';

interface Message {
  content: string;
  role: 'system' | 'user' | 'assistant';
}

interface AIRequest {
  messages: Message[];
  model: string;
  temperature: number;
}

interface AIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      refusal: string | null;
      annotations: any[];
    };
    logprobs: any;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function ai(question: string, chatHistory: Message[] = []): Promise<string> {
  const messages: Message[] = [
    {
      content: "Hello, how can i assist you today?",
      role: "system"
    },
    ...chatHistory,
    {
      content: question,
      role: "user"
    }
  ];

  const data: AIRequest = {
    messages,
    model: "gpt-3.5-turbo-0125",
    temperature: 0.9
  };

  const config = {
    method: 'POST' as const,
    url: 'https://mpzxsmlptc4kfw5qw2h6nat6iu0hvxiw.lambda-url.us-east-2.on.aws/process',
    headers: {
      'User-Agent': 'okhttp/3.14.9',
      'Connection': 'Keep-Alive',
      'Accept-Encoding': 'gzip',
      'Content-Type': 'application/json',
      'Authorization': process.env.KEY_AI as string
    },
    data: data
  };

  try {
    const response = await axios.request<AIResponse>(config);

    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0]!!.message.content;

      if (!content) {
        throw new Error('Empty response from AI');
      }

      return content;
    }

    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
}

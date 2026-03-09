import type { Conversation } from "./db";

export function parseChatMemo(content: string): Conversation[] {
  const sections = content.split("================================================================================");
  const conversations: Conversation[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.startsWith("# Chat Memo") || trimmed.startsWith("Export Time:")) {
      continue;
    }

    const conv = parseConversationBlock(trimmed);
    if (conv) {
      conversations.push(conv);
    }
  }

  return conversations;
}

function parseConversationBlock(block: string): Conversation | null {
  const lines = block.split("\n");
  
  let title = "";
  let url = "";
  let platform = "";
  let created = "";
  let messages = "";
  let messageCount = 0;

  let inMessages = false;
  let currentRole = "";
  let messageContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("Title: ")) {
      title = line.substring(7).trim();
    } else if (line.startsWith("URL: ")) {
      url = line.substring(5).trim();
    } else if (line.startsWith("Platform: ")) {
      platform = line.substring(10).trim();
    } else if (line.startsWith("Created: ")) {
      created = line.substring(9).trim();
    } else if (line.startsWith("Messages: ")) {
      messageCount = parseInt(line.substring(9).trim()) || 0;
    } else if (line.startsWith("User: ") || line.startsWith("AI: ")) {
      if (currentRole && messageContent.length > 0) {
        messages += `${currentRole}: ${messageContent.join("\n")}\n\n`;
      }
      currentRole = line.startsWith("User: ") ? "User" : "AI";
      const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
      messageContent = timestampMatch ? [line.substring(line.indexOf("]") + 2).trim()] : [line.substring(line.indexOf(":") + 2).trim()];
    } else if (currentRole && line.trim()) {
      messageContent.push(line);
    }
  }

  if (currentRole && messageContent.length > 0) {
    messages += `${currentRole}: ${messageContent.join("\n")}\n\n`;
  }

  if (!title || !platform) {
    return null;
  }

  return {
    title,
    url,
    platform,
    created,
    messages: messages.trim(),
    messageCount
  };
}

export function exportToChatMemo(conversations: Conversation[]): string {
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  let output = `# Chat Memo - All Conversations\nExport Time: ${now}\nTotal Conversations: ${conversations.length}\n`;

  for (const conv of conversations) {
    output += `\n================================================================================\n\n`;
    output += `Title: ${conv.title}\n`;
    if (conv.url) output += `URL: ${conv.url}\n`;
    output += `Platform: ${conv.platform}\n`;
    output += `Created: ${conv.created}\n`;
    
    const msgCount = (conv.messages.match(/^(User:|AI:)/gm) || []).length;
    output += `Messages: ${msgCount}\n\n`;
    output += conv.messages + "\n";
  }

  return output;
}

import { serve } from "bun";
import { readFile } from "fs/promises";
import { addConversation, getAllConversations, searchConversations, getStats, clearAll, deleteConversation } from "./db";
import { parseChatMemo, exportToChatMemo } from "./parser";

const server = serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/" || path === "/index.html") {
      return new Response(await readFile("./public/index.html"), {
        headers: { "Content-Type": "text/html" }
      });
    }

    if (path === "/api/stats" && req.method === "GET") {
      const stats = getStats();
      return Response.json(stats);
    }

    if (path === "/api/conversations" && req.method === "GET") {
      const keyword = url.searchParams.get("q");
      const convs = keyword ? searchConversations(keyword) : getAllConversations();
      return Response.json(convs);
    }

    if (path === "/api/import" && req.method === "POST") {
      try {
        const text = await req.text();
        const conversations = parseChatMemo(text);
        console.log("Parsed conversations:", conversations.length);
        let added = 0;
        for (const conv of conversations) {
          const result = addConversation(conv);
          added += result;
          console.log("Added:", conv.title, conv.platform, result);
        }
        return Response.json({ success: true, added, total: conversations.length, parsed: conversations.length });
      } catch (e) {
        return Response.json({ success: false, error: String(e) }, { status: 400 });
      }
    }

    if (path === "/api/export" && req.method === "GET") {
      const convs = getAllConversations();
      const text = exportToChatMemo(convs);
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": "attachment; filename=chat-memo-export.txt"
        }
      });
    }

    if (path === "/api/clear" && req.method === "POST") {
      clearAll();
      return Response.json({ success: true });
    }

    if (path.startsWith("/api/delete/") && req.method === "DELETE") {
      const id = parseInt(path.split("/").pop() || "0");
      deleteConversation(id);
      return Response.json({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  }
});

console.log(`Server running at http://localhost:${server.port}`);

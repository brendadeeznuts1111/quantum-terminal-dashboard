// Enhanced Bun Fetch Demo Server
// Supports all Bun fetch API features: POST, streaming, custom headers, etc.

export default {
  hostname: "0.0.0.0",

  async fetch(req) {
    const url = new URL(req.url);
    const startTime = Date.now();

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    };

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Route handling
    switch (url.pathname) {
      case "/":
        return handleRoot(req, corsHeaders);
      case "/post":
        return handlePost(req, corsHeaders);
      case "/echo":
        return handleEcho(req, corsHeaders);
      case "/headers":
        return handleHeaders(req, corsHeaders);
      case "/json":
        return handleJSON(req, corsHeaders);
      case "/stream":
        return handleStream(req, corsHeaders);
      case "/slow":
        return handleSlow(req, corsHeaders);
      case "/bytes":
        return handleBytes(req, corsHeaders);
      case "/blob":
        return handleBlob(req, corsHeaders);
      default:
        return new Response(
          JSON.stringify({ error: "Not Found", path: url.pathname }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  },
};

// Root endpoint
function handleRoot(req, corsHeaders) {
  return new Response(
    JSON.stringify(
      {
        message: "Enhanced Bun Fetch Demo Server",
        status: "running",
        endpoints: {
          "/": "This endpoint (GET)",
          "/post": "POST request handler",
          "/echo": "Echo back request body",
          "/headers": "Show received headers",
          "/json": "JSON response",
          "/stream": "Streaming response",
          "/slow": "Slow response (for timeout testing)",
          "/bytes": "Binary response",
          "/blob": "Blob response",
        },
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

// POST request handler
async function handlePost(req, corsHeaders) {
  let body = null;
  let bodyType = "none";

  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const contentType = req.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        body = await req.json();
        bodyType = "json";
      } else if (contentType.includes("multipart/form-data")) {
        body = await req.formData();
        bodyType = "formData";
      } else {
        body = await req.text();
        bodyType = "text";
      }
    } catch (e) {
      body = await req.text();
      bodyType = "text";
    }
  }

  return new Response(
    JSON.stringify(
      {
        message: "POST request received",
        method: req.method,
        bodyType,
        body,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

// Echo back request body
async function handleEcho(req, corsHeaders) {
  const body = await req.text();
  return new Response(body || "No body received", {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

// Show received headers
function handleHeaders(req, corsHeaders) {
  const headers = {};
  for (const [key, value] of req.headers) {
    headers[key] = value;
  }

  return new Response(
    JSON.stringify(
      {
        message: "Headers received",
        method: req.method,
        headers,
        customHeaders: {
          "x-custom-header": req.headers.get("x-custom-header"),
          authorization: req.headers.get("authorization"),
          "content-type": req.headers.get("content-type"),
        },
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

// JSON response
function handleJSON(req, corsHeaders) {
  return new Response(
    JSON.stringify(
      {
        userId: 1,
        id: 1,
        title: "Hello from Bun server",
        completed: true,
        data: {
          nested: true,
          array: [1, 2, 3],
          timestamp: new Date().toISOString(),
        },
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

// Streaming response
function handleStream(req, corsHeaders) {
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = [
        "Chunk 1: Hello\n",
        "Chunk 2: from\n",
        "Chunk 3: streaming\n",
        "Chunk 4: response\n",
        "Chunk 5: done!\n",
      ];

      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
        await new Promise((r) => setTimeout(r, 100));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

// Slow response for timeout testing
async function handleSlow(req, corsHeaders) {
  const delay = parseInt(new URL(req.url).searchParams.get("delay") || "3000");
  await new Promise((r) => setTimeout(r, Math.min(delay, 10000)));

  return new Response(
    JSON.stringify(
      {
        message: "Slow response completed",
        delay,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

// Binary response
function handleBytes(req, corsHeaders) {
  const data = new Uint8Array([72, 101, 108, 108, 111, 32, 66, 117, 110, 33]); // "Hello Bun!"
  return new Response(data, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/octet-stream" },
  });
}

// Blob response
function handleBlob(req, corsHeaders) {
  const blob = new Blob(["Hello from Blob!"], { type: "text/plain" });
  return new Response(blob, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

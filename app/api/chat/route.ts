import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory } = await request.json()
    console.log(`📝 Received message: "${message}"`)

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is not set in environment variables.")
      return NextResponse.json(
        {
          response:
            "Sorry, API key configuration problem hai. Please contact the developer to set up the Gemini API key.",
        },
        { status: 500 },
      )
    }

    console.log("🔑 Using API key (first 10 chars):", apiKey.substring(0, 10) + "...")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 1000, // Increased maxOutputTokens for longer responses
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    })
    console.log("🤖 Model initialized successfully with safety settings.")

    // Format chat history for Gemini API
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }))

    // Ensure history alternates roles correctly (user, model, user, model...)
    const validHistory: any[] = []
    let expectedRole: "user" | "model" = "user"

    for (const msg of formattedHistory) {
      if (msg.role === expectedRole) {
        validHistory.push(msg)
        expectedRole = expectedRole === "user" ? "model" : "user"
      } else if (validHistory.length === 0 && msg.role === "model") {
        // Skip initial bot message if history starts with it, to align with Gemini API requirements
        console.log("Skipping initial bot message in history to align with Gemini API requirements.")
        continue
      } else {
        console.warn(`History out of sequence. Expected ${expectedRole}, got ${msg.role}. Stopping history processing.`)
        break // Stop processing if sequence is broken
      }
    }

    const chat = model.startChat({
      history: validHistory,
      generationConfig: {
        responseMimeType: "text/plain", // Ensure plain text for Markdown rendering
        temperature: 0.7,
      },
      system: `You are TINKO, a helpful and friendly AI assistant for students. Your primary goal is to provide accurate and concise answers. You must reply in the same language the user uses for their message. Do NOT mix languages in a single response.

      If the student's question is short and simple, answer briefly without adding unnecessary details.
      If the question is complex or requires deeper understanding, give a longer, detailed explanation with examples if helpful.
      If the student asks for real-time information (such as current weather, live scores, live events, or stock prices), respond briefly that you cannot provide real-time data because the Gemini API does not have access to live updates.
      Be friendly, clear, and student-focused in tone.`,
    })

    console.log("📤 Sending to Gemini API with chat history...")
    const result = await chat.sendMessage(message)
    const response = result.response
    console.log("✅ Got response from Gemini.")

    const reply = response.text().trim()
    console.log(`🤖 Raw response: "${reply}"`)
    console.log(`📤 Final response: "${reply}"`)
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    console.error("💥 Critical Error in POST handler:", error.message)
    console.error("Full critical error:", error)

    const lowerMessage = (error.message || "").toLowerCase()
    let fallbackResponse = "I am TINKO! How can I help you?"

    if (lowerMessage.includes("api key expired") || lowerMessage.includes("api_key_invalid")) {
      fallbackResponse = "API key expired ho gaya hai! Please developer ko bolke naya key set karwao. 😊"
    } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      fallbackResponse = "Hello! I am TINKO, your AI friend. How are you?"
    } else if (lowerMessage.includes("name")) {
      fallbackResponse = "My name is TINKO! Kartik created me."
    } else if (lowerMessage.includes("what")) {
      fallbackResponse = "I help students. You can ask me anything!"
    } else if (lowerMessage.includes("how")) {
      fallbackResponse = "Tell me what you want to know? I will help you!"
    } else {
      fallbackResponse = "I am a bit confused! Please try again! 😊"
    }

    console.log(`🔄 Using fallback: "${fallbackResponse}"`)
    return NextResponse.json(
      {
        response: fallbackResponse,
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory } = await request.json()
    console.log(`📝 Received message: "${message}"`)

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is not set in environment variables.")
      return NextResponse.json({
        response:
          "Sorry, API key configuration problem hai. Please contact the developer to set up the Gemini API key.",
      })
    }

    console.log("🔑 Using API key (first 10 chars):", apiKey.substring(0, 10) + "...")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 500, // Increased from 100 in previous fix
        temperature: 0.7,
      },
    })

    console.log("🤖 Model initialized successfully")

    // Updated prompt: TINKO will reply in the user's language, without mixing languages in a single response.
    const prompt = `You are TINKO, a friendly AI assistant for students. You must reply in the same language the user uses for their message. Do NOT mix languages in a single response. Keep your responses concise and to the point.

Student: ${message}
TINKO:`

    console.log("📤 Sending to Gemini API...")

    try {
      const result = await model.generateContent(prompt)
      console.log("✅ Got response from Gemini")

      const response = result.response
      let reply = response.text().trim()

      console.log(`🤖 Raw response: "${reply}"`)

      // Removed the explicit 30-word truncation and non-English character removal
      // The AI model should handle language based on the prompt.
      // reply = reply.replace(/[^\w\s.,!?]/g, "").trim() // Removed this line

      console.log(`📤 Final response: "${reply}"`)

      return NextResponse.json({ response: reply })
    } catch (apiError: any) {
      console.error("❌ Gemini API Error:", apiError.message)
      console.error("Error details:", apiError)

      if (apiError.message?.includes("API key expired") || apiError.message?.includes("API_KEY_INVALID")) {
        return NextResponse.json({
          response: "API key expired ho gaya hai! Please developer ko bolke naya key set karwao. 😊",
        })
      }

      // Fallback responses are now in English, as the primary language is English unless user specifies.
      // However, for this specific request, the fallback should also try to match the input language.
      // For simplicity, I'll keep them in English for now, as the main AI will handle language switching.
      const lowerMessage = message.toLowerCase()
      let fallbackResponse = "I am TINKO! How can I help you?"

      if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
        fallbackResponse = "Hello! I am TINKO, your AI friend. How are you?"
      } else if (lowerMessage.includes("name")) {
        fallbackResponse = "My name is TINKO! Kartik created me."
      } else if (lowerMessage.includes("what")) {
        fallbackResponse = "I help students. You can ask me anything!"
      } else if (lowerMessage.includes("how")) {
        fallbackResponse = "Tell me what you want to know? I will help you!"
      }

      console.log(`🔄 Using fallback: "${fallbackResponse}"`)
      return NextResponse.json({ response: fallbackResponse })
    }
  } catch (error: any) {
    console.error("💥 Critical Error:", error.message)
    console.error("Full error:", error)

    return NextResponse.json({
      response: "I am a bit confused! Please try again! 😊",
    })
  }
}

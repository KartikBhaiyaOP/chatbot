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
        // Increased maxOutputTokens to allow for longer responses
        maxOutputTokens: 500, // Increased from 100
        temperature: 0.7,
      },
    })

    console.log("🤖 Model initialized successfully")

    const prompt = `You are Nexa, a friendly AI assistant for students. You ONLY speak English. If the user speaks in any other language, politely ask them to please speak in English. Keep your responses concise and to the point.

Student: ${message}
Nexa:`

    console.log("📤 Sending to Gemini API...")

    try {
      const result = await model.generateContent(prompt)
      console.log("✅ Got response from Gemini")

      const response = result.response
      let reply = response.text().trim()

      console.log(`🤖 Raw response: "${reply}"`)

      // Removed the explicit 30-word truncation
      reply = reply.replace(/[^\w\s.,!?]/g, "").trim()

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

      const lowerMessage = message.toLowerCase()
      let fallbackResponse = "I am Nexa! How can I help you?"

      if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
        fallbackResponse = "Hello! I am Nexa, your AI friend. How are you?"
      } else if (lowerMessage.includes("name")) {
        fallbackResponse = "My name is Nexa! Kartik created me."
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

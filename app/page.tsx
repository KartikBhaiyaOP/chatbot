"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"
import ReactMarkdown from "react-markdown" // Import ReactMarkdown
import remarkGfm from "remark-gfm" // Import remarkGfm for GitHub Flavored Markdown

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

export default function NexaChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm TINKO, your friendly AI assistant created by Kartik for Atal Adarsh Vidyalaya Atal Tinkering Lab. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    console.log("📤 Sending message:", input)
    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      console.log("🌐 Making API call...")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          chatHistory: messages.slice(-10), // Increased memory to last 10 messages
        }),
      })

      console.log("📡 API Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.response || "Unknown error"}`)
      }

      const data = await response.json()
      console.log("📥 Received data:", data)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "Sorry, I couldn't understand that.",
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
      console.log("✅ Message added to chat")
    } catch (error: any) {
      console.error("❌ Frontend Error:", error.message)
      console.error("Full error:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          error.message.includes("API key expired") || error.message.includes("API key not valid")
            ? "API key expired ho gaya hai! Please developer ko bolke naya key set karwao. 😊"
            : "Sorry, connection problem hai! Phir se try karo! 😊",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      console.log("🏁 Request completed")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header - Updated name to TINKO */}
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
              <Bot className="w-8 h-8" />
              TINKO
            </CardTitle>
            <p className="text-blue-100">Your Smart Companion from the Tinkering Lab</p>
            <p className="text-sm text-blue-200">Developed by Kartik | Atal Adarsh Vidyalaya Atal Tinkering Lab</p>
          </CardHeader>
        </Card>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-lg text-gray-700">Chat with TINKO</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages - Changed from ScrollArea to a simple div with overflow-y-auto */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === "user" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                      }`}
                    >
                      {message.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === "user" ? "bg-blue-500 text-white ml-auto" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {/* Use ReactMarkdown to render the content */}
                      <ReactMarkdown className="text-sm" remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                      <p className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                {/* This div will be scrolled into view to ensure the latest message is visible */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4 text-gray-600">
          <p className="text-sm">Made with ❤️ for Atal Adarsh Vidyalaya students</p>
        </div>
      </div>
    </div>
  )
}
